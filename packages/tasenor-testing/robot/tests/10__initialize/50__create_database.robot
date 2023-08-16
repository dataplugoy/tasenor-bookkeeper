#
# Requires:
# tests/10__initialize/20__create_user.robot
#

*** Settings ***
Resource                                ../../resources/common.robot
Suite Setup                             Standard Suite Setup
Suite Teardown                          Standard Suite Teardown

*** Test Cases ***
Create Database
    Login as User
    Change Language                     fi
    Create Finnish Database             ${TEST_DATABASE}    ${TEST_COMPANY}     FinnishLimitedCompanyComplete
    Change Language                     en
    Create Period                       ${YEAR}-01-01       ${YEAR}-12-31
