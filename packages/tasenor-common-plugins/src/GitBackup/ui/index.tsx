import React, { useState, useEffect, useRef } from 'react'
import { Note, IconButton, SubPanel, ToolPlugin, Dialog, Title } from '@tasenor/common-ui'
import { makeObservable, observable, runInAction } from 'mobx'
import { Trans, useTranslation } from 'react-i18next'
import { Box, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from '@mui/material'
import { Store, Timestring } from '@tasenor/common'

interface MakeBackupIconProps {
  disabled: boolean
  onMakeBackup: (string) => void
}

function MakeBackupIcon(props: MakeBackupIconProps): React.ReactNode {
  const { disabled, onMakeBackup } = props
  const [askMessage, setAskMessage] = useState(false)
  const [message, setMessage] = useState('')
  const { t } = useTranslation()
  const val = useRef(message) // For some reason the message is not up to date when enter pressed on dialog.

  return <>
    {
      <Dialog
        wider
        isVisible={askMessage}
        title={t('Comment for Git Commit')} onClose={() =>
          setAskMessage(false)}
        onConfirm={() => onMakeBackup(val.current.trim())}
      >
        <TextField fullWidth autoFocus value={val.current} onChange={(e) => { setMessage(e.target.value); val.current = e.target.value }}/>
      </Dialog>
    }
    <IconButton id="Make Backup" disabled={disabled} onClick={() => setAskMessage(true)} title="summarize-make-backup" icon="save" />
  </>
}

interface GitBackupCommit {
  hash: string
  date: Timestring
  message: string
  author: string
}

interface BackupCommitListProps {
  store: Store
  backups: number
}

function BackupCommitList(props: BackupCommitListProps): React.ReactNode {
  const { store, backups } = props
  const [commits, setCommits] = useState<GitBackupCommit>([])

  useEffect(() => {
    if (!store.db) {
      return
    }
    store.request<{ commits: GitBackupCommit[] }>(`/db/${store.db}/tools/${GitBackup.code}`, 'GET', { type: 'commits', count: 20 }).then((res) => {
      if (res.success) {
        setCommits(res.data.commits)
      }
    })
  }, [store.db, backups])

  return <TableContainer>
    <Table>
      <TableBody>
        {commits.map((commit, idx) => <TableRow key={idx}>
          <TableCell>
            <Box><Typography color="secondary">{commit.hash}</Typography></Box>
            <Typography variant="body1">{commit.message}</Typography>
            <Typography variant="caption">{commit.author}</Typography>
          </TableCell>
        </TableRow>)}
      </TableBody>
    </Table>
  </TableContainer>
}

class GitBackup extends ToolPlugin {

  busy = false
  commits = []
  backups = 0

  static code = 'GitBackup'
  static title = 'Backup for Git'
  static version = '1.0.4'
  static icon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"></path></svg>'
  static releaseDate = '2022-12-12'
  static use = 'both'
  static type = 'tool'
  static description = 'Tool for backing up database to the git repository.'

  constructor() {
    super()

    makeObservable(this, {
      busy: observable,
      commits: observable,
      backups: observable,
    })

    this.languages = {
      // TODO: This is too simple labeling. Need to add plugin code as well.
      en: {
        'label-repository': 'Repository URL',
        'label-subDirectory': 'Subdirectory inside the repository',
        'label-sshPrivateKey': 'SSH private key',
        'icon-summarize-make-backup': 'Make a backup'
      },
      fi: {
        'label-repository': 'Git-säilön URL',
        'label-subDirectory': 'Alihakemiston nimi säilön sisällä',
        'label-sshPrivateKey': 'SSH yksityinen avain',
        'icon-summarize-make-backup': 'Tee varmuuskopio',

        'Backup for Git': 'Git-pohjainen Varmuuskopiointi',
        'Manual backup by GitBackup {version}': 'Ylimääräinen varmuuskopio GitBackup {version}',
        'Backup created successfully.': 'Varmuuskopion luominen onnistui.',
        'Creating backup failed.': 'Varmuuskopion luominen ei onnistunut.'
      }
    }

  }

  toolMenu() {
    return [{ title: 'Backup for Git', disabled: !this.store.database }]
  }

  toolTitle() {
    return 'Backup for Git'
  }

  async onMakeBackup(message: string) {
    runInAction(() => (this.busy = true))
    const { success } = await this.POST({ makeBackup: message || this.t('Manual backup by GitBackup {version}').replace('{version}', GitBackup.version) }) as { success: boolean }
    runInAction(() => {
      this.busy = false
      runInAction(() => {
        // Trigger refresh.
        this.backups = this.backups + 1
      })
      if (success) {
        this.store.addMessage(this.t('Backup created successfully.'))
      } else {
        this.store.addError(this.t('Creating backup failed.'))
      }
    })
  }

  toolTopPanel() {
    const repo = this.getSetting('repository')
    return <MakeBackupIcon disabled={!repo || this.busy} onMakeBackup={(msg) => this.onMakeBackup(msg)} />
  }

  toolMainPanel() {
    const repo = this.getSetting('repository')
    if (!repo) {
      return <>
        <Note><Trans>You need to configure this tool first from the configuration page.</Trans></Note>
      </>
    }

    return <>
      <SubPanel>
        <Trans>This tool takes every night automatically one backup.</Trans><> </>
        <Trans>You can also make immediately backup from the icon above.</Trans><> </>
      </SubPanel>
      <Box sx={{ m: 2 }}>
        <BackupCommitList backups={this.backups} store={this.store}/>
      </Box>
    </>
  }

  getSettings() {
    return {
      type: 'flat',
      elements: [
        {
          type: 'text',
          name: 'repository',
          actions: {}
        },
        {
          type: 'text',
          name: 'subDirectory',
          actions: {}
        },
        {
          type: 'text',
          name: 'sshPrivateKey',
          multiline: true,
          actions: {}
        },
        {
          type: 'button',
          label: 'Save',
          actions: {
            onClick: { type: 'saveSettings', plugin: 'GitBackup' }
          }
        }
      ]
    }
  }
}

export default GitBackup
