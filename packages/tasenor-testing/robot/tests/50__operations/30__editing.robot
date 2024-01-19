#
# Requires:
# tests/50__operations/20__periods.robot
#

*** Settings ***
Resource                                ../../resources/common.robot
Suite Setup                             Standard Suite Setup
Suite Teardown                          Standard Suite Teardown

*** Test Cases ***
Test Bad Date Format and Proposal
    Login as User
    Change Language                     en
    Select Database                     robot
    Select Period                       ${NEXT_YEAR}-01-01          ${NEXT_YEAR}-12-31
    Select Account from Balances        1900
    Press Keys                          None    CTRL+a

    # Localization format not right.
    Wait Until Page Contains Element    ${SELECTED_DATE}
    Edit Transaction Cell               7.6.${NEXT_YEAR}
    Should Have Error Message           Date is incorrect.

    # Year is not right.
    Clear Transaction Cell
    Enter Transaction                   ${YEAR}-06-07
    Should Have Error Message           Date is before the current period starts.

    # Get it right.
    Clear Transaction Cell
    Enter Transaction                   ${NEXT_YEAR}-03-31
    Wait Until Page Contains Element    ${SELECTED_ACCOUNT}

    # Fill some stuff. Test automatic proposal as well.
    Press Keys                          None    ARROW_RIGHT
    Wait Until Page Contains Element    ${SELECTED_DESCRIPTION}
    Edit Transaction Cell               Bought even more stuff
    Wait Until Page Contains Element    ${SELECTED_DEBIT}
    Edit Transaction Cell               500
    Wait Until Page Contains Element    ${SELECTED_CREDIT}
    Press Keys                          None    TAB
    Wait Until Page Contains Element    ${SELECTED_ACCOUNT}
    Edit Transaction Cell               4000
    Wait Until Page Contains Element    ${SELECTED_DESCRIPTION}
    Press Keys                          None    ARROW_RIGHT
    Press Keys                          None    ARROW_RIGHT
    Wait Until Page Contains Element    ${SELECTED_CREDIT}
    Press Keys                          None    ENTER
    Sleep                               1s
    Wait Until Page Contains Element    css:.proposal
    Press Keys                          None    ARROW_DOWN
    Press Keys                          None    ENTER
    Sleep                               1s

    # Check balances
    Account Balance Should Be           4000    -500,00€
    Account Balance Should Be           1900    16 490,00€

Delete Lines of Transaction and Whole Transaction
    Login as User
    Change Language                     en
    Select Database                     robot
    Select Period                       ${NEXT_YEAR}-01-01          ${NEXT_YEAR}-12-31
    Select Account from Balances        1900

    # Delete one line.
    Select Named Tx                     Bought even more stuff
    Press Keys                          None    ARROW_DOWN
    Press Keys                          None    ARROW_DOWN
    Wait Until Tx Selected              4000 Ostot
    Press Keys                          None    CTRL+x
    Wait for Dialog                     Delete
    Press Keys                          None    ENTER
    Sleep                               1s

    # Delete the reminder.
    Account Balance Should Be           1900    16 490,00€
    Press Keys                          None    CTRL+x
    Wait for Dialog                     Delete
    Press Keys                          None    ENTER
    Sleep                               1s

    Account Balance Should Be           1900    15 990,00€
