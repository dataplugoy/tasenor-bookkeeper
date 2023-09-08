#
# Requires:
# (Nothing)
#

*** Settings ***
Resource                                ../../resources/common.robot
Suite Setup                             Standard Suite Setup
Suite Teardown                          Standard Suite Teardown

*** Variables ***

${USER_LIST}                            //*[contains(@class, "UserList")]

*** Test Cases ***
Create Admin User
    Ensure Browser Is Open
    Go To Starting URL
    Wait Until Page Contains            Please register an admin user
    Fill in Admin Registration          ${TEST_ADMIN_USER}  ${TEST_ADMIN_PASSWORD}  ${TEST_ADMIN_USER}
    Wait Until No Loading Shadow
    Wait Until Page Contains            Admin Tools
    Logout
