// eslint-disable-next-line no-use-before-define
import React from 'react'
import dayjs from 'dayjs'
import { Trans } from 'react-i18next'
import { AccountNumber, Currency, DocumentModelData, EntryModel, haveKnowledge, ID, Tag, TagType } from '@tasenor/common'
import { Localize, SubPanel, IconButton, IconSpacer, ToolPlugin, Money, TagChip, Dialog, Note } from '@tasenor/common-ui'
import { Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { makeObservable, observable, runInAction } from 'mobx'

class VAT extends ToolPlugin {

  // Observable flag for VAT table dialog.
  showVatTable = false
  // A flag if all requirements are available.
  requirements = false

  static code = 'VAT'
  static title = 'Value Added Tax'
  static version = '1.0.45'
  static icon = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/></g><g><g><g><path d="M7.5,4C5.57,4,4,5.57,4,7.5S5.57,11,7.5,11S11,9.43,11,7.5S9.43,4,7.5,4z M7.5,9C6.67,9,6,8.33,6,7.5S6.67,6,7.5,6 S9,6.67,9,7.5S8.33,9,7.5,9z M16.5,13c-1.93,0-3.5,1.57-3.5,3.5s1.57,3.5,3.5,3.5s3.5-1.57,3.5-3.5S18.43,13,16.5,13z M16.5,18 c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S17.33,18,16.5,18z M5.41,20L4,18.59L18.59,4L20,5.41L5.41,20z"/></g></g></g></svg>'
  static releaseDate = '2022-07-10'
  static use = 'ui'
  static type = 'tool'
  static description = 'General purpose VAT handling. You can configure accounts that automatically inserts either purchase or sales VAT entry. In addition, a tool for paying (receiving) VAT is provided. You need also VAT data plugin for your area.'

  constructor() {
    super()

    makeObservable(this, {
      showVatTable: observable
    })

    this.languages = {
      en: {
        'icon-summarize-vat-period': 'Collect VAT liabilities/receivables',
        'icon-view-vat-table': 'View defined VAT categories',

        'label-delayedPayableAccount': 'An account for payable VAT transferred from the last period',
        'label-delayedReceivableAccount': 'An account for receivable VAT transferred from the last period',
        'label-payableAccount': 'Currently collected VAT payable that is due',
        'label-purchasesAccount': 'An account for recording VAT from purchases',
        'label-receivableAccount': 'Currently collected VAT receivable that is due',
        'label-salesAccount': 'An account for recording VAT from sales',
      },
      fi: {
        'icon-summarize-vat-period': 'Kerää ALV velat/saatavat',
        'icon-view-vat-table': 'Selaa määriteltyjä ALV kategorioita',

        'label-delayedPayableAccount': 'Tili edelliseltä kaudelta siirretyille ALV maksuille',
        'label-delayedReceivableAccount': 'Tili edelliseltä kaudelta siirretyille ALV saataville',
        'label-payableAccount': 'Tämän hetkisten koostetutjen ALV maksujen tili',
        'label-purchasesAccount': 'Tili ostojen ALV:n kirjaamiseen',
        'label-receivableAccount': 'Tämän hetkisten koostetutjen ALV saatavien tili',
        'label-salesAccount': 'Tili myynin ALV:n kirjaamiseen',

        'Cumulated VAT by tags': 'Kertynyt ALV tägeittäin',
        'Cumulated VAT from purchases': 'Kertynyt ALV ostoista',
        'Cumulated VAT from sales': 'Kertynyt ALV myynnistä',
        'Current VAT payable': 'Nykyiset ALV velat',
        'Current VAT receivable': 'Nykyiset ALV saatavat',
        'Defined VAT Categories': 'Määritellyt ALV kategoriat',
        'Delayed VAT': 'Siirretty ALV',
        'Description missing': 'Kuvaus puuttuu',
        'Entries that has no tags': 'Tapahtumat, joissa ei ole yhtään tägiä',
        'Payable to add': 'Lisättävä velkaa',
        'Receivable to add': 'Lisättävä saatavia',
        'This database does not have configured VAT accounts.': 'Tässä tietokannassa ei ole konfiguroituna ALV-tilejä.',
        'Value Added Tax': 'Arvonlisävero',
        VAT: 'ALV',
        'VAT %': 'ALV %',
        'VAT from purchases': 'ALV ostoista',
        'VAT from sales': 'ALV myynnistä',
        'VAT update': 'ALV päivitys',
        'No VAT data found. Please add VAT data plugin.': 'Tietoa ALV:stä ei löydy. Ole hyvä ja lisää lisäosa, josta ALV tiedot löytyvät.',
        'No income and expense knowledge base found. Please install a plugin for it.': 'Tulojen ja menojen tietämyskanta puuttuu. Ole hyvä ja lisää lisäosa, josta tiedot löytyvät.'
      }
    }
  }

  init(catalog) {
    catalog.registerHook('editTransaction', (document, row, column, originalValue) => this.editTransaction(document, row, column, originalValue))
    this.requirements = catalog.isAvailable('IncomeAndExpenses')
  }

  toolMenu() {
    return [{ title: 'Value Added Tax', disabled: !this.store.periodId }]
  }

  toolTitle() {
    return 'Value Added Tax'
  }

  /**
   * Gather documents with non-reconciled VAT entries.
   */
  openVATDocuments() {
    const VAT_SALES_ACCOUNT = this.settings.get('VAT.salesAccount') as AccountNumber
    const VAT_PURCHASES_ACCOUNT = this.settings.get('VAT.purchasesAccount') as AccountNumber
    return this.store.getDocuments([VAT_SALES_ACCOUNT, VAT_PURCHASES_ACCOUNT], (entry) => !entry.data || !entry.data.VAT || (!entry.data.VAT.reconciled && !entry.data.VAT.ignore))
  }

  /**
   * Calculate sum of unprocessed payable and receivable for VAT.
   * @return {Object} An object with `sales` and `purchases`.
   */
  VATSummary() {
    let sales = 0
    let purchases = 0

    const VAT_SALES_ACCOUNT = this.settings.get('VAT.salesAccount')
    const VAT_PURCHASES_ACCOUNT = this.settings.get('VAT.purchasesAccount')

    this.openVATDocuments().forEach((doc) => {
      doc.entries.forEach((entry) => {
        const acc = entry.account.number
        if (acc === VAT_SALES_ACCOUNT) {
          sales += entry.total
        }
        if (acc === VAT_PURCHASES_ACCOUNT) {
          purchases += entry.total
        }
      })
    })
    return { sales, purchases }
  }

  /**
   * Icons and VAT table viewer.
   * @param index
   * @returns
   */
  toolTopPanel() {
    const knowledge = haveKnowledge()
    const table = this.requirements ? knowledge.vatTable() : []
    const { store } = this
    const VAT = store.period ? this.VATSummary() : { sales: 0, purchases: 0 }
    return (
      <>
        <IconButton id="Summarize VAT" key="button-vat" disabled={!this.requirements || (!VAT.sales && !VAT.purchases)} onClick={() => this.createVATEntry()} title="summarize-vat-period" icon="summarize" />
        <IconSpacer/>
        <IconButton id="View VAT Table" title="view-vat-table" key="view-vat-table" icon="view" onClick={() => {
          runInAction(() => {
            this.showVatTable = true
          })
        }}/>
          <Dialog
            title={<Trans>Defined VAT Categories</Trans>}
            isVisible={this.showVatTable}
            okOnly
            onClose={() => {
              runInAction(() => {
                this.showVatTable = false
              })
            }
          }>
            <TableContainer>
              <Table className="TransactionTable" size="medium" padding="none">
                <TableHead>
                  <TableRow>
                    <TableCell variant="head"><Trans>Category</Trans></TableCell>
                    <TableCell variant="head"><Trans>VAT</Trans></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>

                  {table.length < 1 && <TableRow><TableCell colSpan={2}><Trans>No VAT data found. Please add VAT data plugin.</Trans></TableCell></TableRow>}

                  {table.map(line => <TableRow key={line.id}>
                    <TableCell sx={{ paddingLeft: line.level * 2 }}>
                      <Trans>{line.name}</Trans>
                    </TableCell>
                    <TableCell>
                      {line.value}%
                    </TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
            </TableContainer>
          </Dialog>
      </>
    )
  }

  toolMainPanel() {
    if (!this.requirements) {
      return <Note>
        <Trans>You must install Income and Expenses plugin.</Trans>
      </Note>
    }

    const { store } = this
    if (!store.period) {
      return <></>
    }

    const VAT = this.VATSummary()

    const VAT_SALES_ACCOUNT = this.settings.get('VAT.salesAccount') as AccountNumber
    const VAT_PURCHASES_ACCOUNT = this.settings.get('VAT.purchasesAccount') as AccountNumber
    const VAT_RECEIVABLE_ACCOUNT = this.settings.get('VAT.receivableAccount') as AccountNumber
    const VAT_PAYABLE_ACCOUNT = this.settings.get('VAT.payableAccount') as AccountNumber
    const VAT_DELAYED_RECEIVABLE_ACCOUNT = this.settings.get('VAT.delayedReceivableAccount') as AccountNumber
    const VAT_DELAYED_PAYABLE_ACCOUNT = this.settings.get('VAT.delayedPayableAccount') as AccountNumber
    const VAT_STATEMENT_TAG_TYPES = this.settings.get('VAT.statementTagTypes') as TagType[]

    const vatSalesAccount = this.store.database.getAccountByNumber(VAT_SALES_ACCOUNT)
    const vatPurchasesAccount = this.store.database.getAccountByNumber(VAT_PURCHASES_ACCOUNT)
    const vatPayableAccount = this.store.database.getAccountByNumber(VAT_PAYABLE_ACCOUNT)
    const vatReceivableAccount = this.store.database.getAccountByNumber(VAT_RECEIVABLE_ACCOUNT)
    const vatDelayedPayableAccount = this.store.database.getAccountByNumber(VAT_DELAYED_PAYABLE_ACCOUNT)
    const vatDelayedReceivableAccount = this.store.database.getAccountByNumber(VAT_DELAYED_RECEIVABLE_ACCOUNT)

    if (!vatSalesAccount || !vatPurchasesAccount || !vatPayableAccount || !vatReceivableAccount || !vatDelayedReceivableAccount || !vatDelayedPayableAccount) {
      return (
        <div>
          <SubPanel>
            <Trans>This database does not have configured VAT accounts.</Trans>
          </SubPanel>
        </div>)
    }

    const payable = store.period.getBalanceByNumber(VAT_PAYABLE_ACCOUNT)
    const receivable = store.period.getBalanceByNumber(VAT_RECEIVABLE_ACCOUNT)
    const payableDelayed = store.period.getBalanceByNumber(VAT_DELAYED_PAYABLE_ACCOUNT)
    const receivableDelayed = store.period.getBalanceByNumber(VAT_DELAYED_RECEIVABLE_ACCOUNT)
    const openVATDocuments = store.period ? this.openVATDocuments() : []

    // Split by tags.
    const VAT_TAG_TYPES: TagType[] = VAT_STATEMENT_TAG_TYPES || []
    const validTags = new Set(
      Object.values(this.store.database.tagsByTag)
        .filter(tag => VAT_TAG_TYPES.includes(tag.type as TagType))
        .map(tag => tag.tag)
    )

    const vatByTag: Record<Tag, number> = {}
    let vatByNoTag = null
    let hasTags = false

    const addVatByTags = (tags, amount) => {
      tags = tags.filter(tag => validTags.has(tag))
      if (!tags.length) {
        vatByNoTag = (vatByNoTag || 0) + amount
        return
      }
      hasTags = true
      const share = (amount >= 0 ? Math.ceil(amount / tags.length) : Math.floor(amount / tags.length))
      tags.forEach((tag) => {
        const delta = (amount >= 0 ? Math.min(amount, share) : Math.max(amount, share))
        vatByTag[tag] = (vatByTag[tag] || 0) + delta
        amount -= delta
      })
    }

    for (const doc of openVATDocuments) {
      for (const entry of doc.entries) {
        if (entry.account_id === vatSalesAccount.id || entry.account_id === vatPurchasesAccount.id) {
          addVatByTags(entry.tagNames, entry.total)
        }
      }
    }

    const currency: Currency = this.settings.get('currency') as Currency

    return (
      <div>
        <SubPanel>
          <b>
            <Link onClick={() => this.goto(vatReceivableAccount.getUrl())}>
              <Trans>Current VAT receivable</Trans>: <Money currency={currency} cents={(receivable && receivable.total) || 0}></Money>
            </Link>
            &nbsp;
            {
              receivableDelayed && receivableDelayed.total !== 0 &&
              <Link onClick={() => this.goto(vatReceivableAccount.getUrl())}>
                (<Trans>Delayed VAT</Trans>: <Money currency={currency} cents={receivableDelayed.total || 0}></Money>)
              </Link>
            }
            <br/>
            <Link onClick={() => this.goto(vatPayableAccount.getUrl())}>
              <Trans>Current VAT payable</Trans>: <Money currency={currency} cents={(payable && payable.total) || 0}></Money>
            </Link>
            &nbsp;
            {
              payableDelayed && payableDelayed.total !== 0 &&
              <Link onClick={() => this.goto(vatDelayedPayableAccount.getUrl())}>
                (<Trans>Delayed VAT</Trans>: <Money currency={currency} cents={payableDelayed.total || 0}></Money>)
              </Link>
            }
            <br/>
            <br/>
            <Link onClick={() => this.goto(vatPurchasesAccount.getUrl())}>
              <Trans>Cumulated VAT from purchases</Trans>: <Money currency={currency} cents={VAT.purchases}></Money>
            </Link>
            <br/>
            <Link onClick={() => this.goto(vatSalesAccount.getUrl())}>
              <Trans>Cumulated VAT from sales</Trans>: <Money currency={currency} cents={VAT.sales}></Money>
            </Link>
            <br/>
            <Trans>{VAT.sales + VAT.purchases < 0 ? 'Payable to add' : 'Receivable to add'}</Trans>: <Money currency={currency} cents={VAT.sales + VAT.purchases}></Money><br/>
          </b>
        </SubPanel>
        { hasTags &&
          <SubPanel>
            <b><Trans>Cumulated VAT by tags</Trans>:</b>
            <table>
              <tbody>
                {Object.entries(vatByTag).map(([tag, amount]) => <tr key={tag}>
                  <td width="48px"><TagChip tag={this.store.database.getTag(tag as Tag)} /></td>
                  <td width="48px">{tag}</td>
                  <td>{this.store.database.getTag(tag as Tag).name}</td>
                  <td><Money currency={currency} cents={amount}></Money></td>
                </tr>)}
                {vatByNoTag && <tr>
                  <td></td>
                  <td></td>
                  <td><Trans>Entries that has no tags</Trans></td>
                  <td><Money currency={currency} cents={vatByNoTag}></Money></td>
                </tr>}
              </tbody>
            </table>
          </SubPanel>
        }
        { openVATDocuments.length > 0 &&
          <SubPanel>
            {openVATDocuments.map((doc) => {
              return <div key={doc.id}>
                <Localize date={doc.date} />
                <br/>
                { doc.entries.map((entry) => {
                  return <div key={entry.id}>
                    <b> {entry.account.toString()} </b>
                    {entry.text || <span style={{ color: 'red' }}><Trans>Description missing</Trans></span>}
                    <span> </span><Money currency={currency} cents={entry.total}></Money>
                  </div>
                })
                }
                <br />
              </div>
            })}
          </SubPanel>
        }
      </div>
    )
  }

  /**
   * Combine unprocessed VAT to new payable or receivable entry.
   */
  async createVATEntry() {

    const VAT_SALES_ACCOUNT: AccountNumber = this.settings.get('VAT.salesAccount') as AccountNumber
    const VAT_PURCHASES_ACCOUNT: AccountNumber = this.settings.get('VAT.purchasesAccount') as AccountNumber
    const VAT_RECEIVABLE_ACCOUNT: AccountNumber = this.settings.get('VAT.receivableAccount') as AccountNumber
    const VAT_PAYABLE_ACCOUNT: AccountNumber = this.settings.get('VAT.payableAccount') as AccountNumber
    const VAT_DELAYED_RECEIVABLE_ACCOUNT: AccountNumber = this.settings.get('VAT.delayedReceivableAccount') as AccountNumber
    const VAT_DELAYED_PAYABLE_ACCOUNT: AccountNumber = this.settings.get('VAT.delayedPayableAccount') as AccountNumber

    // Collect entries.
    let sales = 0
    let purchases = 0
    const entries: EntryModel[] = []
    for (const doc of this.openVATDocuments()) {
      for (const entry of doc.entries) {
        const acc = entry.account.number
        if (acc === VAT_SALES_ACCOUNT) {
          sales += entry.total
          entries.push(entry)
        }
        if (acc === VAT_PURCHASES_ACCOUNT) {
          purchases += entry.total
          entries.push(entry)
        }
      }
    }

    if (!this.store.period) {
      throw new Error('Canont create VAT entries without period.')
    }

    // Create new VAT payable/receivable.
    let date = dayjs().format('YYYY-MM-DD')
    let isDelayed = false
    if (date > this.store.period.end_date) {
      isDelayed = true
      date = this.store.period.end_date
    }

    const doc: DocumentModelData = {
      period_id: this.store.period.id as ID,
      date,
      entries: []
    }

    // Just to keep compiler happy.
    if (!doc.entries) {
      return
    }

    if (sales) {
      doc.entries.push({
        number: VAT_SALES_ACCOUNT,
        amount: -sales,
        data: { VAT: { ignore: true } },
        description: this.t('VAT update')
      })
    }
    if (purchases) {
      doc.entries.push({
        number: VAT_PURCHASES_ACCOUNT,
        amount: -purchases,
        data: { VAT: { ignore: true } },
        description: this.t('VAT update')
      })
    }
    // Add it to the receivable or to the payable VAT.
    if (sales + purchases < 0) {
      doc.entries.push({
        number: isDelayed ? VAT_DELAYED_PAYABLE_ACCOUNT : VAT_PAYABLE_ACCOUNT,
        amount: sales + purchases,
        data: { VAT: { ignore: true } },
        description: this.t('VAT update')
      })
    }
    if (sales + purchases > 0) {
      doc.entries.push({
        number: isDelayed ? VAT_DELAYED_RECEIVABLE_ACCOUNT : VAT_RECEIVABLE_ACCOUNT,
        amount: sales + purchases,
        data: { VAT: { ignore: true } },
        description: this.t('VAT update')
      })
    }

    await this.store.period.createDocument(doc)

    // Mark entries as reconciled.
    runInAction(async () => {
      for (const entry of entries) {
        if (entry.data) {
          entry.data.VAT = entry.data.VAT || {}
          entry.data.VAT.reconciled = true
        }
        await entry.save()
      }
    })

    await this.store.fetchBalances()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async editTransaction(document, row, column, originalValue) {

    // If editing date, no interest.
    if (row === null) {
      return
    }

    // Dig some usable references.
    const entry = document.entries[row]
    const date = document.date || new Date()
    const account = entry.account
    const knowledge = haveKnowledge()

    // Helper to create VAT entry, if needed VAT percentage found.
    const checkAndAddVat = async (vatAccountNumber, isExpense) => {
      if (!account || !vatAccountNumber) {
        return
      }

      const vatPercentage = knowledge.vat(account.data.code, date)
      const text = `${this.t('VAT')} ${vatPercentage}%`
      const vatAccount = this.store.database.getAccountByNumber(vatAccountNumber)

      if (vatPercentage) {
        if (document.entries.filter(e => e.account_id === vatAccount.id).length === 0) {
          await runInAction(async () => {
            const vatAmount = Math.round(entry.amount - entry.amount / (1 + vatPercentage / 100))
            const vat = {
              id: vatAccount.id,
              amount: isExpense ? vatAmount : -vatAmount,
              description: `${entry.description} ${text}`.trim()
            }
            entry.amount -= vatAmount
            await entry.save()
            await document.createEntry(vat)
          })
          return new Set([vatAccountNumber])
        }
      } else {
        // Check that the reason is not related to missing plugin.
        const { income, vat } = knowledge.count()
        if (!vat) {
          this.store.addError('No VAT data found. Please add VAT data plugin.')
        }
        if (!income) {
          this.store.addError('No income and expense knowledge base found. Please install a plugin for it.')
        }
      }
    }

    // Automatically add VAT entry for purchases.
    if (column === 2) {
      if (account.type === 'EXPENSE') {
        return await checkAndAddVat(this.getSetting('purchasesAccount'), true)
      }
    // Automatically add VAT entry for sales.
    } else if (column === 3) {
      if (account.type === 'REVENUE') {
        return await checkAndAddVat(this.getSetting('salesAccount'), false)
      }
    }
  }

  getSettings() {
    // Should actually also remove defaults given elsewhere
    return {
      type: 'flat',
      elements: [
        {
          type: 'account',
          name: 'delayedPayableAccount',
          filter: {
            type: 'LIABILITY'
          }
        },
        {
          type: 'account',
          name: 'delayedReceivableAccount',
          filter: {
            type: 'ASSET'
          }
        },
        {
          type: 'account',
          name: 'payableAccount',
          filter: {
            type: 'LIABILITY'
          }
        },
        {
          type: 'account',
          name: 'purchasesAccount',
          filter: {
            type: 'LIABILITY'
          }
        },
        {
          type: 'account',
          name: 'receivableAccount',
          filter: {
            type: 'ASSET'
          }
        },
        {
          type: 'account',
          name: 'salesAccount',
          filter: {
            type: 'LIABILITY'
          }
        },
        {
          type: 'button',
          label: 'Save',
          actions: {
            onClick: { type: 'saveSettings', plugin: 'VAT' }
          }
        }
      ]
    }
  }
}
export default VAT
