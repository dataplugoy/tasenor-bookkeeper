import { DataPlugin } from '@tasenor/common-node'
import { PluginCode, Version } from '@tasenor/common'

class IncomeAndExpenses extends DataPlugin {
  constructor() {
    super('income', 'expense', 'taxTypes', 'assetCodes')

    this.code = 'IncomeAndExpenses'as PluginCode
    this.title = 'Income and Expense Classification'
    this.version = '1.0.71' as Version
    this.icon = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><rect fill="none" height="24" width="24"/><g opacity=".3"><path d="M10,5h4v14h-4V5z M4,11h4v8H4V11z M20,19h-4v-6h4V19z"/></g><g><path d="M16,11V3H8v6H2v12h20V11H16z M10,5h4v14h-4V5z M4,11h4v8H4V11z M20,19h-4v-6h4V19z"/></g></svg>'
    this.releaseDate = '2023-05-16'
    this.use = 'backend'
    this.type = 'data'
    this.description = 'This plugin provides complete catalog for all income and expense types as well as asset codes. The catalog is tree-like structure which can be used by other plugins for classifying various things.'

    this.languages = {
      // START TRANSLATION
      en: {
        'assets-ACCRUED_INCOME': 'Prepayments and accrued income',
        'assets-APPROPRIATIONS': 'Appropriations',
        'assets-ASSETS': 'Assets',
        'assets-BONDS': 'Bonds',
        'assets-CAPITAL_RESERVERS': 'Capital and reserves',
        'assets-CAPITAL_RESERVERS_AND_LIABILITIES': 'Capital, reserves and liabilities',
        'assets-CASH': 'Cash at bank and in hand',
        'assets-CASH_AT_BANK': 'Cash at bank',
        'assets-CASH_AT_CRYPTO_BROKER': 'Cash at cryptocurrency broker account',
        'assets-CASH_AT_P2P': 'Cash at peer-to-peer lender',
        'assets-CASH_AT_STOCK_BROKER': 'Cash at stock broker account',
        'assets-CASH_IN_HAND': 'Cash in hand',
        'assets-CONVERTIBLE_BONDS': 'Convertible bonds',
        'assets-CREDITORS': 'Creditors',
        'assets-CURRENT_ASSETS': 'Current assets',
        'assets-CURRENT_CRYPTOCURRENCIES': 'Cryptocurrencies',
        'assets-CURRENT_DEBTORS': 'Debtors',
        'assets-CURRENT_INVESTMENTS': 'Investments',
        'assets-CURRENT_PRIVATE_STOCK_SHARES': 'Unlisted shares',
        'assets-CURRENT_PUBLIC_STOCK_SHARES': 'Publicly listed shares',
        'assets-CURRENT_STOCKS': 'Stocks',
        'assets-EURO_AREA_SALES_RECEIVABLES': 'Sales receivables from Euro Zone',
        'assets-EU_SALES_RECEIVABLES': 'Sales receivables from EU',
        'assets-FINLAND_SALES_RECEIVABLES': 'Sales receivables from Finland',
        'assets-GROUP_UNDERTAKINGS_HOLDINGS': 'Holdings in group undertakings',
        'assets-INTANGLIBLE_ASSETS': 'Intanglible assets',
        'assets-INVESTMENTS': 'Investments',
        'assets-LIABILITITES_TO_CREDIT_INSTITUTIONS': 'Liabilities to credit institutions',
        'assets-LOANS_RECEIVABLE': 'Loans receivable',
        'assets-NON_CURRENT_ASSETS': 'Non-current assets',
        'assets-OTHER_CREDITORS': 'Other creditors',
        'assets-OTHER_DEBTORS': 'Other debtors',
        'assets-OTHER_INVESTMENTS': 'Other investments',
        'assets-OTHER_SHARES': 'Other shares and similar ownerships',
        'assets-OWNED_BY_GROUP': 'Amounts owned by group undertakings',
        'assets-OWNED_BY_PARTICIPATING': 'Amounts owned by participating interest undertakings',
        'assets-P2P_LOANS_RECEIVABLE': 'Peer to peer loans receivable',
        'assets-PROVISIONS': 'Provisions',
        'assets-SHORT_SELLING_STOCKS': 'Short-selling stocks',
        'assets-STOCK_BROKER_LOANS': 'Stock-broker loans',
        'assets-SUBSCRIBED_CAPITAL': 'Subscribed capital',
        'assets-SUBSRIBED_CAPITAL_UNPAID': 'Subscribed capital unpaid',
        'assets-TANGLIBLE_ASSETS': 'Intanglible assets',
        'assets-TRADE_DEBTORS': 'Trade debtors',
        'assets-UNPAID_PROFIT_DISTRIBUTIONS': 'Unpaid profit distributions',
        'expense-ACCOMMODATION': 'Accommodation',
        'expense-ADMIN': 'Administration',
        'expense-ADMIN_OTHER': 'Other Adminstration',
        'expense-BANKING_FEE': 'Banking Fees',
        'expense-BOOK': 'Books',
        'expense-BUS_TICKET': 'Bus Tickets',
        'expense-CAPITAL': 'Capital',
        'expense-CAPITAL_EXPENSES': 'Capital Expenses',
        'expense-CAPITAL_LOSS': 'Capital Losses',
        'expense-CAPITAL_RELATED_TRANSFERS_OUT': 'Capital Related Transfers',
        'expense-COMPUTER': 'Computers',
        'expense-COMPUTER_ACCESSORIES': 'Computer Accessories',
        'expense-COMPUTING': 'Computing',
        'expense-CORPORATE-TAX_PAYMENT': 'Corporate Tax Payment',
        'expense-DESKTOP': 'Desktop Computers',
        'expense-DIVIDEND_PAYMENT': 'Dividend Payment',
        'expense-DIVIDEND_WITHHOLDING': 'Dividend Payment Witholding Tax',
        'expense-ENTERTAINMENT': 'Entertainment Expenses',
        'expense-EQUIPMENT': 'Equipment',
        'expense-ERROR_EXPENSE': 'Error in Expenses',
        'expense-EXPENSE': 'Expenses',
        'expense-EXPENSE_CORRECTIONS': 'Corrections in Expenses',
        'expense-EXPENSE_CORRECTION_WITHHOLDING_TAX': 'Corrections in Withholding Tax',
        'expense-FINANCIAL_MANAGEMENT': 'Financial Management',
        'expense-FURNITURE': 'Furniture',
        'expense-FX_OUT': 'Foreign Exchange',
        'expense-HARDWARE': 'Hardware',
        'expense-HOTEL': 'Hotel',
        'expense-INFORMATION': 'Information Services',
        'expense-INTEREST_EXPENSE': 'Interest Expense',
        'expense-INTERNAL_MEETING': 'Internal meeting',
        'expense-INTERNET': 'Internet Expenses',
        'expense-LAPTOP': 'Laptop Computers',
        'expense-MACHINERY': 'Machinery',
        'expense-MEETINGS': 'Meetings',
        'expense-MISC_EXPENSES': 'Miscellaneous Expenses',
        'expense-NEEDS_MANUAL_INSPECTION': 'Needs Manual Inspection',
        'expense-NEWSPAPERS': 'Newspapers',
        'expense-OFFICIAL_FEES': 'Official Fees',
        'expense-OPTIONAL_PERSONNEL_EXPENSE': 'Optional Personnel Expenses',
        'expense-OTHER_EXPENSES': 'Other Expenses',
        'expense-PERSONNEL': 'Personnel Expenses',
        'expense-PERSONNEL_MEALS': 'Meals for Personnel',
        'expense-PHONE': 'Phone Expenses',
        'expense-PLANE_TICKET': 'Airplane Tickets',
        'expense-POSTAGE': 'Postage',
        'expense-POSTAGE_STAMPS': 'Postage Stamps',
        'expense-PRINTER': 'Printers',
        'expense-ROUNDING_ERROR': 'Rounding Errors',
        'expense-SHAREHOLDER_LOAN_PAYMENT': 'Shareholder Loan Payment',
        'expense-SOCIAL_RECEPTIONS': 'Social Receptions',
        'expense-SOFTWARE': 'Software',
        'expense-SPECIAL_EXPENSE_CASES': 'Cases That Need Special Handling',
        'expense-STOCK_BROKER_INACTIVITY_FEE': 'Stock Broker Inactivity Fee',
        'expense-STOCK_BROKER_SERVICE_FEE': 'Stock Broker Service Fee',
        'expense-TAXI': 'Taxi',
        'expense-TAX_RELATED_TRANSFERS': 'Tax Related Transfers',
        'expense-TICKET': 'Travelling Ticket Expenses',
        'expense-TRADE_LOSS': 'Trading Losses',
        'expense-TRADE_LOSS_CRYPTO': 'Trading Losses from Cryptocurrencies',
        'expense-TRADE_LOSS_CURRENCY': 'Trading Losses from Currencies',
        'expense-TRADE_LOSS_SHORT': 'Trading Losses from Short Contracts',
        'expense-TRADE_LOSS_STOCK': 'Trading Losses from Stocks',
        'expense-TRAIN_TICKET': 'Train Tickets',
        'expense-TRAVEL': 'Travelling Expenses',
        'expense-VAT_PAYMENT': 'VAT Payment',
        'expense-VEHICLES': 'Vehicles',
        'income-CAPITAL_GAIN': 'Capital Gains',
        'income-CAPITAL_INCOME': 'Capital Income',
        'income-CAPITAL_RELATED_TRANSFERS_IN': 'Capital Related Transfers',
        'income-CORPORATE_TAX_REFUND': 'Corporate Tax Refund',
        'income-DIVIDEND': 'Dividends',
        'income-ERROR_INCOME': 'Error in Income',
        'income-EURO_AREA_SALES': 'Sales to Euro Area',
        'income-EU_SALES': 'Sales to EU Area',
        'income-FINLAND_SALES': 'Sales to Finland',
        'income-FX_IN': 'Foreign Exchange',
        'income-INCOME': 'Income',
        'income-INCOME_CORRECTIONS': 'Corrections in income',
        'income-INCOME_CORRECTION_DEPOSIT': 'Corrections in Deposit',
        'income-INCOME_CORRECTION_WITHHOLDING_TAX': 'Corrections in Withholding Tax',
        'income-INTEREST': 'Interest Income',
        'income-INVEST': 'Capital Investments',
        'income-LISTED_CASH_DIVIDEND': 'Cash Dividends from Listed Companies',
        'income-LISTED_DIVIDEND': 'Dividends from Listed Companies',
        'income-LISTED_STOCK_DIVIDEND': 'Stock Dividends from Listed Companies',
        'income-MISC_INCOME': 'Miscellaneous Income',
        'income-NEEDS_MANUAL_INSPECTION_IN': 'Needs Manual Inspection',
        'income-NON_EURO_AREA_SALES': 'Sales to Non-Euro EU Area',
        'income-NON_EU_SALES': 'Sales to Outside EU Area',
        'income-NON_LISTED_DIVIDEND': 'Dividends from Non-Listed Companies',
        'income-NREQ': 'Non-Restricted Equity Capital',
        'income-OTHER_INCOME': 'Other Income',
        'income-OTHER_OPERATING_INCOME': 'Other operating income',
        'income-P2P_INTEREST': 'Interest Income from P2P Loaning',
        'income-PAID_SHARES': 'Payment Received from Company Shares',
        'income-SALES': 'Sales',
        'income-SHAREHOLDER_BORROWING': 'Loan from a Shareholder',
        'income-SHARE_ISSUED': 'Issue New Shares',
        'income-SPECIAL_INCOME_CASES': 'Cases That Need Special Handling',
        'income-TAX_RELATED_TRANSFERS_IN': 'Tax Related Transfers',
        'income-TRADE_PROFIT': 'Trade Profits',
        'income-TRADE_PROFIT_CRYPTO': 'Trade Profits from Cryptocurrencies',
        'income-TRADE_PROFIT_CURRENCY': 'Trade Profits from Currencies',
        'income-TRADE_PROFIT_SHORT': 'Trade Profits from Short Contracts',
        'income-TRADE_PROFIT_STOCK': 'Trade Profits from Stocks',
        'income-VAT_DELAYED_REFUND': 'VAT Refund (from previous period)',
        'income-VAT_REFUND': 'VAT Refund',
        'tax-CORPORATE_TAX': 'Corporate Tax',
        'tax-PENALTY_OF_DELAY': 'Penalty of Delayed Payment',
        'tax-TAX_AT_SOURCE': 'Tax at Source',
        'tax-VAT_DELAYED_PAYABLE': 'Delayed VAT Payable',
        'tax-VAT_DELAYED_RECEIVABLE': 'Delayed VAT Receivable',
        'tax-VAT_FROM_PURCHASES': 'VAT from Purchases',
        'tax-VAT_FROM_SALES': 'VAT from Sales',
        'tax-VAT_PAYABLE': 'VAT Payable',
        'tax-VAT_RECEIVABLE': 'VAT Receivable',
        'tax-WITHHOLDING_TAX': 'Withholding Tax'
      },
      fi: {
        'assets-ACCRUED_INCOME': 'Siirtosaamiset',
        'assets-APPROPRIATIONS': 'Tilinpäätössiirtojen kertymä',
        'assets-ASSETS': 'Vastaavaa',
        'assets-BONDS': 'Joukkovelkakirjalainat',
        'assets-CAPITAL_RESERVERS': 'Oma pääoma',
        'assets-CAPITAL_RESERVERS_AND_LIABILITIES': 'Vastattavaa',
        'assets-CASH': 'Rahat ja pankkisaamiset',
        'assets-CASH_AT_BANK': 'Pankkisaamiset',
        'assets-CASH_AT_CRYPTO_BROKER': 'Pankkisaamiset kryptovälittäjillä',
        'assets-CASH_AT_P2P': 'Pankkisaamiset vertaislainavälittäjällä',
        'assets-CASH_AT_STOCK_BROKER': 'Pankkisaamiset osakevälittäjillä',
        'assets-CASH_IN_HAND': 'Käteinen',
        'assets-CONVERTIBLE_BONDS': 'Vaihtovelkakirjalainat',
        'assets-CREDITORS': 'Vieras pääoma',
        'assets-CURRENT_ASSETS': 'Vaihtuvat vastaavat',
        'assets-CURRENT_CRYPTOCURRENCIES': 'Kryptovaluutat',
        'assets-CURRENT_DEBTORS': 'Saamiset',
        'assets-CURRENT_INVESTMENTS': 'Rahoitusarvopaperit',
        'assets-CURRENT_PRIVATE_STOCK_SHARES': 'Listaamattomat osakkeet',
        'assets-CURRENT_PUBLIC_STOCK_SHARES': 'Pörssinoteeratut osakkeet',
        'assets-CURRENT_STOCKS': 'Vaihto-omaisuus',
        'assets-EURO_AREA_SALES_RECEIVABLES': 'Myyntisaamiset euroalueelta',
        'assets-EU_SALES_RECEIVABLES': 'Myyntisaamiset EU-alueelta',
        'assets-FINLAND_SALES_RECEIVABLES': 'Myyntisaamiset Suomesta',
        'assets-GROUP_UNDERTAKINGS_HOLDINGS': 'Osuudet saman konsernin yrityksissä',
        'assets-INTANGLIBLE_ASSETS': 'Aineettomat hyödykkeet',
        'assets-INVESTMENTS': 'Sijoitukset',
        'assets-LIABILITITES_TO_CREDIT_INSTITUTIONS': 'Lainat rahoituslaitoksilta',
        'assets-LOANS_RECEIVABLE': 'Lainasaamiset',
        'assets-NON_CURRENT_ASSETS': 'Pysyvät vastaavat',
        'assets-OTHER_CREDITORS': 'Muut velat',
        'assets-OTHER_DEBTORS': 'Muut saamiset',
        'assets-OTHER_INVESTMENTS': 'Muut arvopaperit',
        'assets-OTHER_SHARES': 'Muut osakkeet ja osuudet',
        'assets-OWNED_BY_GROUP': 'Saamiset saman konsernin yrityksiltä',
        'assets-OWNED_BY_PARTICIPATING': 'Saamiset omistusyhteysyrityksiltä',
        'assets-P2P_LOANS_RECEIVABLE': 'Vertaislainasaamiset',
        'assets-PROVISIONS': 'Pakolliset varaukset',
        'assets-SHORT_SELLING_STOCKS': 'Osakkeiden lyhyeksimyynti',
        'assets-STOCK_BROKER_LOANS': 'Lainat osakevälittäjiltä',
        'assets-SUBSCRIBED_CAPITAL': 'Osake-, osuus- tai muu vastaava pääoma',
        'assets-SUBSRIBED_CAPITAL_UNPAID': 'Maksamattomat osakkeet/osuudet',
        'assets-TANGLIBLE_ASSETS': 'Aineelliset hyödykkeet',
        'assets-TRADE_DEBTORS': 'Myyntisaamiset',
        'assets-UNPAID_PROFIT_DISTRIBUTIONS': 'Voitonjakovelat',
        'expense-ACCOMMODATION': 'Majoitus',
        'expense-ADMIN': 'Hallintokulut',
        'expense-ADMIN_OTHER': 'Muut hallintokulut',
        'expense-BANKING_FEE': 'Rahaliikenteen kulut',
        'expense-BOOK': 'Kirjat',
        'expense-BUS_TICKET': 'Bussiliput',
        'expense-CAPITAL': 'Pääoma',
        'expense-CAPITAL_EXPENSES': 'Pääomakulut',
        'expense-CAPITAL_LOSS': 'Myyntitappiot',
        'expense-CAPITAL_RELATED_TRANSFERS_OUT': 'Pääomaliikkeisiin liittyvät tilisiirrot',
        'expense-COMPUTER': 'Tietokoneet',
        'expense-COMPUTER_ACCESSORIES': 'Tietokoneen lisälaitteet',
        'expense-COMPUTING': 'Tietotekniikka',
        'expense-CORPORATE-TAX_PAYMENT': 'Yhteisöveron maksu',
        'expense-DESKTOP': 'Pöytätietokoneet',
        'expense-DIVIDEND_PAYMENT': 'Osingonmaksu',
        'expense-DIVIDEND_WITHHOLDING': 'Osingonmaksun ennakonpidätys',
        'expense-ENTERTAINMENT': 'Edustuskulut',
        'expense-EQUIPMENT': 'Koneet ja kalusteet',
        'expense-ERROR_EXPENSE': 'Virheellinen kulu',
        'expense-EXPENSE': 'Kulut',
        'expense-EXPENSE_CORRECTIONS': 'Korjaukset kulutietoihin',
        'expense-EXPENSE_CORRECTION_WITHHOLDING_TAX': 'Korjaukset ennakonpidätyksiin',
        'expense-FINANCIAL_MANAGEMENT': 'Taloushallinnon kulu',
        'expense-FURNITURE': 'Kalusteet',
        'expense-FX_OUT': 'Valuutanvaihto',
        'expense-HARDWARE': 'Tietotekninen laitteisto',
        'expense-HOTEL': 'Hotellimajoitus',
        'expense-INFORMATION': 'Tietopalvelut',
        'expense-INTEREST_EXPENSE': 'Korkokulu',
        'expense-INTERNAL_MEETING': 'Kokous- ja palaverikulut',
        'expense-INTERNET': 'Internetkulut',
        'expense-LAPTOP': 'Kannettavat tietokoneet',
        'expense-MACHINERY': 'Koneet',
        'expense-MEETINGS': 'Tapaamiset',
        'expense-MISC_EXPENSES': 'Satunnaiset kulut',
        'expense-NEEDS_MANUAL_INSPECTION': 'Tutkittava tarkemmin käsin',
        'expense-NEWSPAPERS': 'Sanomalehdet',
        'expense-OFFICIAL_FEES': 'Viranomaismaksut',
        'expense-OPTIONAL_PERSONNEL_EXPENSE': 'Vapaaehtoiset henkilöstökulut',
        'expense-OTHER_EXPENSES': 'Muut kulut',
        'expense-PERSONNEL': 'Henkilöstökulut',
        'expense-PERSONNEL_MEALS': 'Henkilöstön ateriointi',
        'expense-PHONE': 'Puhelinkulut',
        'expense-PLANE_TICKET': 'Lentoliput',
        'expense-POSTAGE': 'Postikulut',
        'expense-POSTAGE_STAMPS': 'Postimerkit',
        'expense-PRINTER': 'Tulostimet',
        'expense-ROUNDING_ERROR': 'Pyöristysvirheet',
        'expense-SHAREHOLDER_LOAN_PAYMENT': 'Osakaslainan takaisinmaksu',
        'expense-SOCIAL_RECEPTIONS': 'Edustustapahtumat',
        'expense-SOFTWARE': 'Ohjelmistot',
        'expense-SPECIAL_EXPENSE_CASES': 'Erityiskäsittelyä vaativat tapaukset',
        'expense-STOCK_BROKER_INACTIVITY_FEE': 'Osakevälittäjän epäaktiivisuusmaksu',
        'expense-STOCK_BROKER_SERVICE_FEE': 'Osakevälittäjän palvelumaksu',
        'expense-TAXI': 'Taksikulut',
        'expense-TAX_RELATED_TRANSFERS': 'Veroihin liittyvät tilisiirrot',
        'expense-TICKET': 'Matkalippukulut',
        'expense-TRADE_LOSS': 'Myyntitappiot vaihto-omaisuuden kaupankäynnistä',
        'expense-TRADE_LOSS_CRYPTO': 'Myyntitappiot kryptovaluutoista',
        'expense-TRADE_LOSS_CURRENCY': 'Myyntitappiot valuutoista',
        'expense-TRADE_LOSS_SHORT': 'Myyntitappiot lyhyeksimyynneistä',
        'expense-TRADE_LOSS_STOCK': 'Myyntitappiot osakkeista',
        'expense-TRAIN_TICKET': 'Junaliput',
        'expense-TRAVEL': 'Matkakulut',
        'expense-VAT_PAYMENT': 'ALV maksu',
        'expense-VEHICLES': 'Ajoneuvot',
        'income-CAPITAL_GAIN': 'Myyntivoitot',
        'income-CAPITAL_INCOME': 'Pääomatulot',
        'income-CAPITAL_RELATED_TRANSFERS_IN': 'Pääomaliikkeisiin liittyvät tilisiirrot',
        'income-CORPORATE_TAX_REFUND': 'Yhteisöveron palautus',
        'income-DIVIDEND': 'Osingot',
        'income-ERROR_INCOME': 'Virheellinen tulo',
        'income-EURO_AREA_SALES': 'Myynti euroalueelle',
        'income-EU_SALES': 'Myynti euroopan yhteisön alueelle',
        'income-FINLAND_SALES': 'Myynti Suomeen',
        'income-FX_IN': 'Valuutanvaihto',
        'income-INCOME': 'Tulot',
        'income-INCOME_CORRECTIONS': 'Korjaukset tulotietoihin',
        'income-INCOME_CORRECTION_DEPOSIT': 'Korjaukset talletuksiin',
        'income-INCOME_CORRECTION_WITHHOLDING_TAX': 'Korjaukset ennakonpidätyksiin',
        'income-INTEREST': 'Korkotulot',
        'income-INVEST': 'Pääomasijoitukset',
        'income-LISTED_CASH_DIVIDEND': 'Käteisosingot listatuista yhtiöistä',
        'income-LISTED_DIVIDEND': 'Osingot listatuista yhtiöistä',
        'income-LISTED_STOCK_DIVIDEND': 'Osakeosingot listatuista yhtiöistä',
        'income-MISC_INCOME': 'Satunnaiset tulot',
        'income-NEEDS_MANUAL_INSPECTION_IN': 'Tutkittava tarkemmin käsin',
        'income-NON_EURO_AREA_SALES': 'Myynti euroopan yhteisön euroalueen ulkopuolelle',
        'income-NON_EU_SALES': 'Myynti euroopan yhteisön ulkopuolelle',
        'income-NON_LISTED_DIVIDEND': 'Osingot listaamattomista yhtiöistä',
        'income-NREQ': 'SVOP sijoitus',
        'income-OTHER_INCOME': 'Muut tulot',
        'income-OTHER_OPERATING_INCOME': 'Muut liiketoiminnan tuotot',
        'income-P2P_INTEREST': 'Korkotulot P2P lainaamisesta',
        'income-PAID_SHARES': 'Osakeannista saadut maksut',
        'income-SALES': 'Myynti',
        'income-SHAREHOLDER_BORROWING': 'Osakaslainan nosto',
        'income-SHARE_ISSUED': 'Uusien osakkeiden liikkeellelasku',
        'income-SPECIAL_INCOME_CASES': 'Erityiskäsittelyä vaativat tapaukset',
        'income-TAX_RELATED_TRANSFERS_IN': 'Veroihin liittyvät tilisiirrot',
        'income-TRADE_PROFIT': 'Myyntivoitot vaihto-omaisuuden kaupankäynnistä',
        'income-TRADE_PROFIT_CRYPTO': 'Myyntivoitot kryptovaluutoista',
        'income-TRADE_PROFIT_CURRENCY': 'Myyntivoitot valuutoista',
        'income-TRADE_PROFIT_SHORT': 'Myyntivoitot lyhyeksimyynnistä',
        'income-TRADE_PROFIT_STOCK': 'Myyntivoitot osakkeista',
        'income-VAT_DELAYED_REFUND': 'ALV alarajahuojennus (siirretty)',
        'income-VAT_REFUND': 'ALV alarajahuojennus',
        'tax-CORPORATE_TAX': 'Yhteisövero',
        'tax-PENALTY_OF_DELAY': 'Veromaksun myöhästymissakko',
        'tax-TAX_AT_SOURCE': 'Lähdevero',
        'tax-VAT_DELAYED_PAYABLE': 'ALV siirtosaatavat',
        'tax-VAT_DELAYED_RECEIVABLE': 'ALV siirtovelat',
        'tax-VAT_FROM_PURCHASES': 'ALV ostoista',
        'tax-VAT_FROM_SALES': 'ALV myynnistä',
        'tax-VAT_PAYABLE': 'ALV velat',
        'tax-VAT_RECEIVABLE': 'ALV saatavat',
        'tax-WITHHOLDING_TAX': 'Ennakonpidätys'
      }
      // END TRANSLATION
    }
  }
}

export default IncomeAndExpenses
