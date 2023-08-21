#
# Requires:
# tests/10__initialize/35__create_qa_user.robot
#

*** Settings ***
Resource                                ../../resources/common.robot
Suite Setup                             Standard Suite Setup
Suite Teardown                          Standard Suite Teardown

*** Test Cases ***
Subscribe Needed Plugins
    Login as QA User
    Go To Shop
    Subscribe Plugin If Missing         CoinAPI
    Subscribe Plugin If Missing         DocumentCleaner
    Subscribe Plugin If Missing         Euro
    Subscribe Plugin If Missing         Finnish
    Subscribe Plugin If Missing         FinnishBalanceSheetReport
    Subscribe Plugin If Missing         FinnishIncomeStatementReport
    Subscribe Plugin If Missing         FinnishLimitedCompanyComplete
    Subscribe Plugin If Missing         IncomeAndExpenses
    Subscribe Plugin If Missing         JournalReport
    Subscribe Plugin If Missing         LedgerReport
    Subscribe Plugin If Missing         VAT
    Subscribe Plugin If Missing         VATFinland
