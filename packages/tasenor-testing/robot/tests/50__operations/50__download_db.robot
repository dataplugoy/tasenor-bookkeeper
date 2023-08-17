#
# Requires:
# tests/10__initialize/10__create_user.robot
# tests/10__initialize/20__create_database.robot
# tests/20__transactions/02__insert_some_transactions.robot
# tests/50__operations/10__vat.robot
# tests/50__operations/20__periods.robot
# tests/50__operations/30__editing.robot

*** Settings ***
Resource                                ../../resources/common.robot
Suite Setup                             Standard Suite Setup
Suite Teardown                          Standard Suite Teardown

*** Test Cases ***
Verify That Downloaded Database is Correct
    Login as User
    Select Default Database
    Clear Downloads
    Download Database                   ${TEST_DATABASE}
    ${path}                             Get Database Download File
    Wait for Downloaded File            ${path}
    Compare Tar Packages                ${path}                         data/files/Robot_Oy.tasenor
