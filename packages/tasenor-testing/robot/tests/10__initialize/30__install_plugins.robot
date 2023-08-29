#
# Requires:
# tests/10__initialize/10__create_admin.robot
#

*** Settings ***
Resource                                ../../resources/common.robot
Suite Setup                             Standard Suite Setup
Suite Teardown                          Standard Suite Teardown

*** Test Cases ***
Install All Needed Plugins
    Login As Superuser
    Go To Admin / Plugins
    Click Element                       refresh-plugins
    Wait Until No Loading Shadow
    Install Plugin If Missing           CoinAPI
    Install Plugin If Missing           CoinbaseImport
    Install Plugin If Missing           DocumentCleaner
    Install Plugin If Missing           Euro
    Install Plugin If Missing           Finnish
    Install Plugin If Missing           FinnishBalanceSheetReport
    Install Plugin If Missing           FinnishIncomeStatementReport
    Install Plugin If Missing           FinnishLimitedCompanyComplete
    Install Plugin If Missing           IncomeAndExpenses
    Install Plugin If Missing           JournalReport
    Install Plugin If Missing           LedgerReport
    Install Plugin If Missing           RapidAPI
    Install Plugin If Missing           VAT
    Install Plugin If Missing           VATFinland
    Wait Until Element is Visible       rebuild-plugins
#    Click Element                       rebuild-plugins
    Wait Until No Loading Shadow
    Reload Page
    Logout

Install All Plugins
    [Tags]                              nightly
    Login As Superuser
    Go To Admin / Plugins
    Click Element                       refresh-plugins
    Wait Until No Loading Shadow

    Install Plugin If Missing           CoinAPI
    Install Plugin If Missing           CoinbaseImport
    Install Plugin If Missing           GitBackup
    Install Plugin If Missing           KrakenImport
    Install Plugin If Missing           LynxImport
    Install Plugin If Missing           NordeaImport
    Install Plugin If Missing           NordnetImport
    Install Plugin If Missing           Rand
    Install Plugin If Missing           RapidAPI
    Install Plugin If Missing           TagEditor
    Install Plugin If Missing           TITOImport
    Install Plugin If Missing           USDollar

    Wait Until Element is Visible       rebuild-plugins
    Click Element                       rebuild-plugins

    Wait Until No Loading Shadow
    Reload Page
    Logout
