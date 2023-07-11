import { log } from '@dataplug/tasenor-common'
import fs from 'fs'
import { TransactionImportHandler } from '../import/TransactionImportHandler'
import { TransactionUI } from '../import/TransactionUI'
import { BackendPlugin } from './BackendPlugin'

/**
 * A plugin providing import services for one or more file formats.
 */
export class ImportPlugin extends BackendPlugin {

  private handler: TransactionImportHandler
  private UI: TransactionUI

  constructor(handler: TransactionImportHandler) {
    super()
    this.handler = handler
    this.UI = handler.UI
    // This class is used as its own for translations. Let us initialize it.
    this.languages = this.getLanguages()
  }

  /**
   * Get common translations for all import plugins.
   * @returns
   */
  getLanguages() {
    return {
      en: {
        'account-debt-currency': 'Account for recording debt in {asset} currency',
        'account-deposit-currency': 'Account for depositing {asset} currency',
        'account-deposit-external': 'Account for external deposit source for {asset}',
        'account-distribution-currency': 'Account to pay our {asset} dividends from',
        'account-distribution-statement': 'Account to record our dividend payments for {asset}',
        'account-dividend-currency': 'Account for recording received {asset} dividends',
        'account-expense-currency': 'Account for expenses in {asset} currency',
        'account-expense-statement': 'Account for recording expense {asset}',
        'account-fee-currency': 'Account for fees in {asset} currency',
        'account-fee-crypto': 'Account for fees in {asset} crypto currency',
        'account-forex-currency': 'Account for {asset} foreign exchange',
        'account-income-currency': 'Account for income in {asset} currency',
        'account-income-statement': 'Account for recording income {asset}',
        'account-investment-currency': 'Account for receiving investments in {asset} currency',
        'account-investment-statement': 'Account for recording investment {asset}',
        'account-tax-currency': 'Account for recording tax in currency {asset}',
        'account-tax-statement': 'Account for tax statament {asset}',
        'account-trade-crypto': 'Account for trading crypto currency {asset}',
        'account-trade-stock': 'Account for trading stocks {asset}',
        'account-trade-currency': 'Account for using currency {asset} for trading',
        'account-transfer-currency': 'Account for transferring currency {asset}',
        'account-transfer-external': 'Account for transferring to/from external source {asset}',
        'account-withdrawal-currency': 'Account for withdrawing currency {asset}',
        'account-withdrawal-external': 'Account for withdrawing from external source {asset}',
        'asset-type-crypto': 'a crypto currency',
        'asset-type-currency': 'a currency',
        'asset-type-external': 'an external instance',
        'asset-type-statement': 'a statement recording',
        'asset-type-stock': 'a stock exchange traded asset',
        'asset-type-short': 'a short position',
        'import-text-buy': 'Buy {takeAmount} {takeAsset}',
        'import-text-correction': '{name}',
        'import-text-deposit': 'Deposit to {exchange} service',
        'import-text-distribution': '{name}',
        'import-text-dividend': 'Dividend {asset}',
        'import-text-expense': '{name}',
        'import-text-forex': 'Sell currency {giveAsset} for {takeAsset}',
        'import-text-income': '{name}',
        'import-text-investment': '{name}',
        'import-text-sell': 'Sell {giveAmount} {giveAsset}',
        'import-text-short-buy': 'Closing short position {takeAmount} {takeAsset}',
        'import-text-short-sell': 'Short selling {giveAmount} {giveAsset}',
        'import-text-tax': '{name}',
        'import-text-trade': 'Trade {giveAmount} {giveAsset} {takeAmount} {takeAsset}',
        'import-text-transfer': '{service} transfer',
        'import-text-withdrawal': 'Withdrawal from {exchange} service',
        'reason-deposit': 'deposit',
        'reason-dividend': 'payment',
        'reason-expense': 'expense',
        'reason-fee': 'fee',
        'reason-forex': 'exchange',
        'reason-income': 'income',
        'reason-trade': 'trading',
        'reason-transfer': 'transfers',
        'reason-withdrawal': 'withdrawal',
        'note-split': 'Split',
        'note-converted': 'Converted',
        'note-spinoff': 'Spinoff',
        'note-renamed': 'Renamed',
        'note-old-name': 'Old name',
        'note-new-name': 'New name',
        'note-renaming': 'Renaming'
      },
      fi: {
        'account-debt-currency': 'Tili veloille valuutassa {asset}',
        'account-deposit-currency': 'Tili valuutan {asset} talletuksille',
        'account-deposit-external': 'Vastatili ulkoisille talletuksille {asset}',
        'account-distribution-currency': 'Tili, josta maksetaan {asset} osingot',
        'account-distribution-statement': 'Raportointitili, johon kirjataan maksettavat osingot {asset}',
        'account-dividend-currency': 'Tili saaduista {asset} osingoista',
        'account-expense-currency': 'Tili kuluille {asset} valuutassa',
        'account-expense-statement': 'Raportointitili {asset} kuluille',
        'account-fee-currency': 'Tili käyttömaksuille {asset} valuutassa',
        'account-fee-crypto': 'Tili käyttömaksuille {asset} kryptovaluutassa',
        'account-forex-currency': 'Valuutanvaihtotili {asset} valuutalle',
        'account-income-currency': 'Tili tuloille {asset} valuutassa',
        'account-income-statement': 'Raportointitili {asset} tuloille',
        'account-investment-currency': 'Tili saaduille sijoituksille {asset} valuutassa',
        'account-investment-statement': 'Raportointitili sijoituksille {asset}',
        'account-tax-currency': 'Verot {asset} valuutassa',
        'account-tax-statement': 'Raportointitili veroille {asset}',
        'account-trade-crypto': 'Vaihto-omaisuustili {asset} kryptovaluutalle',
        'account-trade-stock': 'Vaihto-omaisuustili {asset} osakkeelle',
        'account-trade-currency': 'Valuuttatili {asset} valuutalle vaihto-omaisuuden hankintaan',
        'account-transfer-currency': 'Siirtotili {asset} valuutalle',
        'account-transfer-external': 'Siirtotili ulkoiseen kohteeseen {asset}',
        'account-withdrawal-currency': 'Nostotili {asset} valuutalle',
        'account-withdrawal-external': 'Vastatili {asset} nostoille',
        'asset-type-crypto': 'kryptovaluutta',
        'asset-type-currency': 'valuutta',
        'asset-type-external': 'ulkopuolinen instanssi',
        'asset-type-statement': 'raportointi',
        'asset-type-stock': 'osake tai vastaava',
        'asset-type-short': 'lyhyeksi myyty positio',
        'Do you want to import also currency deposits here?': 'Haluatko tuoda myös valuuttojen talletukset tänne?',
        'Do you want to import also currency withdrawals here?': 'Haluatko tuoda myös valuuttojen nostot tänne?',
        'import-text-buy': 'Osto {takeAmount} {takeAsset}',
        'import-text-correction': '{name}',
        'import-text-deposit': 'Talletus {exchange}-palveluun',
        'import-text-distribution': '{name}',
        'import-text-dividend': 'Osinko {asset}',
        'import-text-expense': '{name}',
        'import-text-forex': 'Valuutanvaihto',
        'import-text-income': '{name}',
        'import-text-investment': '{name}',
        'import-text-sell': 'Myynti {giveAmount} {giveAsset}',
        'import-text-short-buy': 'Suljettu lyhyeksimyynti {takeAmount} {takeAsset}',
        'import-text-short-sell': 'Lyhyeksimyynti {giveAmount} {giveAsset}',
        'import-text-tax': '{name}',
        'import-text-trade': 'Vaihto {giveAmount} {giveAsset} {takeAmount} {takeAsset}',
        'import-text-transfer': '{service} siirto',
        'import-text-withdrawal': 'Nosto {exchange}-palvelusta',
        'Parsing error in expression `{expr}`: {message}': 'Virhe laskukaavassa `{expr}`: {message}',
        'reason-deposit': 'talletus',
        'reason-dividend': 'maksu',
        'reason-expense': 'meno',
        'reason-fee': 'kulu',
        'reason-forex': 'vaihto',
        'reason-income': 'tulo',
        'reason-trade': 'vaihdanta',
        'reason-transfer': 'siirto',
        'reason-withdrawal': 'nosto',
        'Retried successfully': 'Uudelleenyritys onnistui',
        'Retry failed': 'Uudelleenyritys ei onnistunut',
        'Select one of the following:': 'Valitse yksi seuraavista:',
        'Additional information needed': 'Tarvitaan lisätietoja',
        'Based on the following imported lines': 'Seuraavien tuotujen rivien perusteella',
        'Do you want to use the same account for all of them?': 'Haluatko käyttää samaa tiliä kaikille samanlaisille?',
        Created: 'Luotuja',
        Duplicates: 'Aiemmin luotuja',
        Ignored: 'Väliinjätettyjä',
        Skipped: 'Ohitettuja',
        'Account Changes': 'Tilien muutokset',
        'Process Was Successfully Completed!': 'Prosessointi saatu päätökseen onnistuneesti!',
        'Do we allow short selling of assets?': 'Sallitaanko lyhyeksi myynti?',
        January: 'tammikuu',
        February: 'helmikuu',
        March: 'maaliskuu',
        April: 'huhtikuu',
        May: 'toukokuu',
        June: 'kesäkuu',
        July: 'heinäkuu',
        August: 'elokuu',
        September: 'syyskuu',
        October: 'lokakuu',
        November: 'marraskuu',
        December: 'joulukuu',
        'note-split': 'splitti',
        'note-converted': 'konvertoitu',
        'note-spinoff': 'irtautuminen',
        'note-renamed': 'uudelleennimeäminen',
        'note-old-name': 'vanha nimi',
        'note-new-name': 'uusi nimi',
        'The account below has negative balance. If you want to record it to the separate debt account, please select another account below:': 'Tilillä {account} on negatiivinen saldo. Jos haluat kirjata negatiiviset saldot erilliselle velkatilille, valitse tili seuraavasta:',
        'The date {date} falls outside of the period {firstDate} to {lastDate}.': 'Päivämäärä {date} on tilikauden {firstDate} - {lastDate} ulkopuolella.',
        'What do we do with that kind of transactions?': 'Mitä tämänkaltaisille tapahtumille tulisi tehdä?',
        'Ignore transaction': 'Jättää väliin',
        'Halt with an error': 'Keskeyttää tuonti virheeseen',
        'Is transaction fee of type {type} already included in the {reason} total?': 'Onko {reason}-tapahtumassa tyypin {type} kulut lisätty valmiiksi yhteissummaan?',
        'Select contra account for imported transactions, i.e. cash account.': 'Valitse vastatili tuotaville tapahtumille (esim. kohteen käteistili).'
      }
    }
  }

  /**
   * Get instance of internal handler class.
   * @returns
   */
  getHandler(): TransactionImportHandler {
    return this.handler
  }

  /**
   * Load and return default rules from the JSON-rules file.
   * @returns
   */
  getRules(): JSON {
    const path = this.filePath('rules.json')
    log(`Reading rules ${path}.`)
    return JSON.parse(fs.readFileSync(path).toString('utf-8')).rules
  }
}
