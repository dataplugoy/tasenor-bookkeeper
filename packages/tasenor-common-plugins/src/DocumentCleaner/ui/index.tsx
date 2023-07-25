// eslint-disable-next-line no-use-before-define
import React from 'react'
import { Title, Localize, SubPanel, IconButton, ToolPlugin } from '@dataplug/tasenor-common-ui'
import { runInAction, computed } from 'mobx'
import { Trans } from 'react-i18next'
import { Typography } from '@mui/material'
import { DocumentModel, ShortDate, ID } from '@dataplug/tasenor-common'

class DocumentCleaner extends ToolPlugin {

  static code = 'DocumentCleaner'
  static title = 'Document Cleaner'
  static version = '1.0.18'
  static icon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M5 10h6v8H5z" opacity=".3"/><path d="M15 16h4v2h-4zm0-8h7v2h-7zm0 4h6v2h-6zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zm2-8h6v8H5v-8zm5-6H6L5 5H2v2h12V5h-3z"/></svg>'
  static releaseDate = '2022-04-09'
  static use = 'ui'
  static type = 'tool'
  static description = 'Tools for renumbering documents by their date. You can also remove all documents that have no entries.'

  constructor() {
    super()
    this.languages = {
      fi: {
        'Document Cleaner': 'Tositteiden Siivous',
        'All documents are correctly numbered.': 'Kaikki tositteet on numeroitu oikein.',
        'Document Cleaning': 'Tositteiden siivous',
        'Documents that need renumbering': 'Uudelleennumerointia vaativat tositteet',
        'Documents having no entries': 'Tyhjät tositteet',
        'No empty documents.': 'Ei tyhjiä tositteita',
      }
    }
  }

  toolMenu() {
    return [{ title: 'Document Cleaning', disabled: !this.store || !this.store.periodId }]
  }

  toolTitle() {
    return 'Document Cleaning'
  }

  /**
   * Gather a list of documents having no entries.
   */
  @computed
  emptyDocuments(period) {
    return Object.values(period.documents).filter((doc: DocumentModel) => doc.entries && doc.entries.length === 0 && doc.number)
  }

  /**
   * Gather change proposals for incorrectly numbered documents.
   */
  @computed
  incorrectlyNumberedDocuments(period) {
    let next = 0
    const changed: { id?: ID, date: ShortDate, number?: number, newNumber: number}[] = []
    const docs = Object.values(period.documents).sort((a: DocumentModel, b: DocumentModel) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.number || 0) - (b.number || 0))
    docs.forEach((doc: DocumentModel) => {
      if (doc.number !== next) {
        changed.push({
          id: doc.id,
          date: doc.date,
          number: doc.number,
          newNumber: next
        })
      }
      next++
    })
    return changed
  }

  toolTopPanel() {
    const { store } = this
    if (!store || !store.period) {
      return <></>
    }
    const toRenumber = store.period && !store.period.locked ? this.incorrectlyNumberedDocuments(store.period) : []
    const toDelete = store.period && !store.period.locked ? this.emptyDocuments(store.period) : []
    return (
      <>
        <IconButton id="Renumber Documents" key="button-renumber" disabled={!toRenumber.length} onClick={() => this.renumberDocuments()} title="sort-documents" icon="sort-up"></IconButton>
        <IconButton id="Drop Empty Documents" key="button-clean" disabled={!toDelete.length} onClick={() => this.dropEmptyDocuments()} title="drop-empty-documents" icon="trash"></IconButton>
      </>
    )
  }

  toolMainPanel() {
    const { store } = this
    if (!store || !store.period) {
      return <></>
    }
    const toRenumber = this.incorrectlyNumberedDocuments(store.period)
    const toDelete = this.emptyDocuments(store.period)
    return (
      <div>
        <Title><Trans>Documents that need renumbering</Trans></Title>
        <SubPanel className="NeedRenumbering">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '1rem', padding: '1rem' }}>
            {
              toRenumber.length
                ? toRenumber.map((c) => <div key={c.id}>
                  <Typography color="primary">
                    <Localize date={c.date} />
                  &nbsp;
                  #{c.number} {'->'} #{c.newNumber}
                  </Typography>
                </div>)
                : <Trans>All documents are correctly numbered.</Trans>
            }
          </div>
        </SubPanel>
        <Title><Trans>Documents having no entries</Trans></Title>
        <SubPanel className="EmptyDocuments">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '1rem', padding: '1rem' }}>
            {
              toDelete.length
                ? toDelete.map((d: DocumentModel) => <div key={d.id}>
                  <Typography color="primary">
                    <Localize date={d.date}></Localize>
                  &nbsp;
                  #{d.number}
                  </Typography>
                </div>)
                : <Trans>No empty documents.</Trans>
            }
          </div>
        </SubPanel>
      </div>
    )
  }

  /**
   * Renumber documents of the period.
   */
  async renumberDocuments() {
    const { store } = this
    if (!store || !store.period) {
      return
    }
    const toRenumber = this.incorrectlyNumberedDocuments(store.period)
    for (const change of toRenumber) {
      if (change.id) {
        const doc = store.period.getDocument(change.id)
        runInAction(() => (doc.number = change.newNumber))
        await doc.save()
      }
    }
  }

  /**
    * Delete all documents without entries.
    */
  async dropEmptyDocuments() {
    const { store } = this
    if (!store || !store.period) {
      return
    }
    runInAction(async () => {
      const toDrop: DocumentModel[] = this.emptyDocuments(store.period) as DocumentModel[]
      for (const doc of toDrop) {
        await doc.delete()
      }
    })
  }
}

export default DocumentCleaner
