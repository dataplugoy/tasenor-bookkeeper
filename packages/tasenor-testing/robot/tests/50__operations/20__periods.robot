#
# Requires:
# tests/50__operations/10__vat.robot
#

*** Settings ***
Resource                                ../../resources/common.robot
Suite Setup                             Standard Suite Setup
Suite Teardown                          Standard Suite Teardown

*** Test Cases ***
Create New Period
    Login as User
    Change Language                     en
    Select Default Database
    Go To Tools
    Select Tool                         Periods

    Should Contain Table Row 4         1       ${YEAR}-01-01   ${YEAR}-12-31   Unlocked

    Click Tool Icon                     Create Period
    Click Element                       OK

    Should Contain Table Row 4         2       ${NEXT_YEAR}-01-01   ${NEXT_YEAR}-12-31   Unlocked

    Select Database                     robot
    Select Period                       ${NEXT_YEAR}-01-01           ${NEXT_YEAR}-12-31

    Account Balance Should Be           1845	1,94€
    Account Balance Should Be           1900	15 990,00€
    Account Balance Should Be           2001	-2 500,00€
    Account Balance Should Be           2251	8,06€
    Account Balance Should Be           2621	-7 500,00€
    Account Balance Should Be           2622	-6 000,00€


Lock a Period
    Login as User
    Change Language                     en
    Select Default Database
    Go To Tools
    Select Tool                         Periods

    Lock Period                         ${YEAR}-01-01
    Should Contain Table Row 4         1       ${YEAR}-01-01   ${YEAR}-12-31   Locked

    Select Database                     robot
    Select Period                       ${YEAR}-01-01           ${YEAR}-12-31
    Select Account from Balances        1900
    Select Named Tx                     Loan from Business Bank
    Go To Line 1 Description
    Press Keys                          None    ENTER
    Should Have Error Message           Cannot edit this entry. Period locked?
