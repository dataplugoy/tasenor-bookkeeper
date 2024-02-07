import React, { useState, useRef } from 'react'
import { Note, IconButton, SubPanel, ToolPlugin, Dialog } from '@tasenor/common-ui'
import { makeObservable, observable, runInAction } from 'mobx'
import { Trans, useTranslation } from 'react-i18next'
import { TextField } from '@mui/material'

interface MakeBackupIconProps {
  disabled: boolean
  onMakeBackup: (string) => void
}

function MakeBackupIcon(props: MakeBackupIconProps) {
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

class GitBackup extends ToolPlugin {

  busy = false

  static code = 'GitBackup'
  static title = 'Backup for Git'
  static version = '1.0.3'
  static icon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"></path></svg>'
  static releaseDate = '2022-12-12'
  static use = 'both'
  static type = 'tool'
  static description = 'Tool for backing up database to the git repository.'

  constructor() {
    super()

    makeObservable(this, {
      busy: observable
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
    // TODO: Listing and restoring backups.
    return <>
      <SubPanel>
        <Trans>This tool takes every night automatically one backup.</Trans><> </>
        <Trans>You can also make immediately backup from the icon above.</Trans><> </>
      </SubPanel>
      <SubPanel>
        <Trans>Currently restore is not yet implemented.</Trans><> </>
        <Trans>In order to restore from the backup, you must ensure to get the wanted version as the latest commit in the Git.</Trans><> </>
        <Trans>Then you need to contact support to let them know that DB needs to be loaded from Git.</Trans>
      </SubPanel>
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
