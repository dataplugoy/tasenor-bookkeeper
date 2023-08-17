#
# Requires:
# tests/10__initialize/20__create_user.robot tests/60__admin/10__registration_enabled.robot

*** Settings ***
Resource                                ../../resources/common.robot
Suite Setup                             Standard Suite Setup

*** Variables ***

*** Test Cases ***
Try To Remove User
    Login as Admin
    Go To Admin / Users
    Select User From List               ${TEST_USER}
    Click Element                       delete-user
    Input Text                          deleted-user-email         ${TEST_EMAIL}FAIL
    Click Element                       OK
    Should Have Error Message           Email was not given correctly.

Actually Remove User
    Login as Admin
    Go To Admin / Users
    Select User From List               ${TEST_USER}
    Click Element                       delete-user
    Input Text                          deleted-user-email         ${TEST_EMAIL}
    Click Element                       OK
    Should Have Info Message            User deleted permanently.

Delete Other Users
    Login as Admin
    Go To Admin / Users
    Select User From List               noname@outside
    Click Element                       delete-user
    Input Text                          deleted-user-email         noname@outside
    Click Element                       OK
    Should Have Info Message            User deleted permanently.
