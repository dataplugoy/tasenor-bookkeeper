#
# Requires:
# tests/10__initialize/50__create_database.robot
#

*** Settings ***
Resource                                ../../resources/common.robot
Suite Setup                             Standard Suite Setup
Suite Teardown                          Standard Suite Teardown

*** Test Cases ***
Create First Few Transactions
    Login as User
    Change Language                     fi
    Select Default Database
    Click Element                       Add Transaction
    Click Element                       Select Account
    Scroll Element Into View            Account 1900
    Click Element                       Account 1900
    Click Element                       OK
    Fill New 2-Part Income Tx           12.3.${YEAR}    Deposit of the company capital      2500    2001
    Click Element                       Add Transaction
    Fill New 2-Part Income Tx           13.3.${YEAR}    Loan from Business Bank             7500    2621
    Click Element                       Add Transaction
    Fill New 2-Part Income Tx           13.3.${YEAR}    Loan from Investment Bank           6000    2622
    Account Balance Should Be           1900    16 000,00€
    Account Balance Should Be           2001    -2 500,00€
    Account Balance Should Be           2621    -7 500,00€
    Account Balance Should Be           2622    -6 000,00€

Create Some VAT Transactions
    Login as User
    Select Default Database
    Select Account from Balances        1900
    Click Element                       Add Transaction
    Fill New 3-Part VAT Expense Tx      16.3.${YEAR}    Buy computer                        300     7680
    Click Element                       Add Transaction
    Fill New 3-Part VAT Expense Tx      16.3.${YEAR}    Buy mouse                           10      7680
    Click Element                       Add Transaction
    Fill New 3-Part VAT Income Tx       16.3.${YEAR}   Sell 1h consultation                 100     3000
    Click Element                       Add Transaction
    Fill New 3-Part VAT Income Tx       16.3.${YEAR}   Sell 2h consultation                 200     3010
    Account Balance Should Be           1900    15 990,00€
    Account Balance Should Be           2001    -2 500,00€
    Account Balance Should Be           2621    -7 500,00€
    Account Balance Should Be           2622    -6 000,00€
    Account Balance Should Be           29391   -58,06€
    Account Balance Should Be           29392   60,00€
    Account Balance Should Be           7680    250,00€
    Account Balance Should Be           3000    -80,65€
    Account Balance Should Be           3010    -161,29€
