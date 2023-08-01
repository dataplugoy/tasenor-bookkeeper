import React from 'react'
import { Note, IconButton, SubPanel, ToolPlugin } from '@tasenor/common-ui'
import { makeObservable, observable, runInAction } from 'mobx'
import { Trans } from 'react-i18next'

class GitBackup extends ToolPlugin {

  busy = false

  static code = 'GitBackup'
  static title = 'Backup for Git'
  static version = '1.0.2'
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
        'summarize-make-backup': 'Make a backup'
      },
      fi: {
        'label-repository': 'Git-säilön URL',
        'label-subDirectory': 'Alihakemisotn nimi säilön sisällä',
        'summarize-make-backup': 'Tee varmuuskopio',

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

  async onMakeBackup() {
    runInAction(() => (this.busy = true))
    const { success } = await this.POST({ makeBackup: this.t('Manual backup by GitBackup {version}').replace('{version}', GitBackup.version) }) as { success: boolean }
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
    return <>
      <IconButton id="Make Backup" disabled={this.busy || !repo} onClick={() => this.onMakeBackup()} title="summarize-make-backup" icon="save" />
    </>
  }

  toolMainPanel() {
    // TODO: We could use here some link utility that keeps selected dbs and ids intact but changes URL parts.
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
        <Trans>Setting up SSH keys is not yet supported.</Trans><> </>
        <Trans>Please contact the support for the server SSH keys to get access to your repository.</Trans>
      </SubPanel>
      <SubPanel>
        <Trans>Currently restore is not yet implemented.</Trans><> </>
        <Trans>In order to restore from the backup, you must ensure to get the wanted version as the latest commit in the Git.</Trans><> </>
        <Trans>Then you need to contact support to let them know that DB needs to be loaded from Git.</Trans>
      </SubPanel>
    </>
  }

  // TODO: Add button to create backup right now. Maybe with comments?
  // TODO: Communicating with backend counterpart needs URL passing all requests to plugin.

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
