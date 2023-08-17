#
# Requires:
# Nothing
#

*** Settings ***
Resource                                ../../resources/common.robot
Suite Setup                             Standard Suite Setup
Suite Teardown                          Standard Suite Teardown

*** Test Cases ***
Enable Registration in System Settings
    Login as Superuser
    Go To System Settings
    Toggle Settings                     canRegister
    Save System Settings
    Logout

Register New User
    Click Element                       Register an account
    Fill in Registration                Noname Outsider     passpass    noname@outside
    Wait for Info Message               User account registered successfully.
