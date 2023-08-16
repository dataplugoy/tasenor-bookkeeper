#
# Requires:
# tests/10__initialize/05__create_admin.robot
#

*** Settings ***
Resource                                ../../resources/common.robot
Suite Setup                             Standard Suite Setup
Suite Teardown                          Standard Suite Teardown

*** Variables ***

${USER_LIST}                            //*[contains(@class, "UserList")]

*** Test Cases ***
Create New User
    Login as Admin
    Go To Admin / Users
    Click Element                       create-user
    Fill in Registration                ${TEST_USER}    ${TEST_PASSWORD}    ${TEST_EMAIL}
    Wait Until No Loading Shadow
    Page Should Contain Element         ${USER_LIST}//*[text() = '${TEST_EMAIL}']
    Should Have Info Message            User created successfully.
    Logout
