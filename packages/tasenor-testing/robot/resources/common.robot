*** Settings ***
Library                                 SeleniumLibrary    timeout=5s    implicit_wait=1s   run_on_failure=Capture Page Screenshot
Library                                 OperatingSystem
Library                                 XvfbRobot
Library                                 String
Library                                 DateTime
Library                                 ../libraries/date_and_time.py
Library                                 ../libraries/security.py
Library                                 ../libraries/report_parsing.py
Library                                 ../libraries/downloading.py
Library                                 ../libraries/directories.py
Resource                                ./shared/files.robot
Resource                                ./shared/inspection.robot
Resource                                ./shared/navigation.robot
Resource                                ./shared/messages.robot
Resource                                ./shared/tables.robot
Resource                                ./admin/plugins.robot
Resource                                ./admin/users.robot
Resource                                ./admin/settings.robot
Resource                                ./shared/misc.robot
Resource                                ./user/transactions.robot
Resource                                ./user/reports.robot
Resource                                ./user/accounts.robot
Resource                                ./user/databases.robot
Resource                                ./user/periods.robot
Resource                                ./user/import.robot
Resource                                ./shared/dialog.robot

*** Variables ***

${TEST_BASE_URL}                        Not set
${TEST_ADMIN_USER}                      Not set
${TEST_ADMIN_PASSWORD}                  Not set
${TEST_USER}                            Not set
${TEST_PASSWORD}                        Not set
${TEST_DEMO_USER}                       Not set
${TEST_DEMO_PASSWORD}                   Not set
${TEST_DATABASE}                        robot
${TEST_COMPANY}                         Robot Oy
${YEAR}                                 2022
${NEXT_YEAR}                            2023
${DEFAULT_TIMEOUT}                      5s
${DEFAULT_INSTALL_TIMEOUT}              60s

*** Keywords ***
Initialize Variables
    ${CI}                               Get Environment Variable    CI
    Set Global Variable                 ${CI}
    Log to Console                      Continuous Integration is ${CI}
    ${TEST_BASE_URL}                    Get Environment Variable    TEST_BASE_URL
    Set Global Variable                 ${TEST_BASE_URL}
    Log to Console                      Base URL is ${TEST_BASE_URL}
    ${TEST_ADMIN_USER}                  Get Environment Variable    TEST_ADMIN_USER
    Set Global Variable                 ${TEST_ADMIN_USER}
    Log to Console                      Admin user is ${TEST_ADMIN_USER}
    ${TEST_ADMIN_PASSWORD}              Get Environment Variable    TEST_ADMIN_PASSWORD
    Set Global Variable                 ${TEST_ADMIN_PASSWORD}
    ${TEST_USER}                        Get Environment Variable    TEST_USER
    Set Global Variable                 ${TEST_USER}
    Log to Console                      Normal user is ${TEST_USER}
    ${TEST_EMAIL}                       Get Environment Variable    TEST_EMAIL
    Set Global Variable                 ${TEST_EMAIL}
    Log to Console                      Normal user email is ${TEST_EMAIL}
    ${TEST_PASSWORD}                    Get Environment Variable    TEST_PASSWORD
    Set Global Variable                 ${TEST_PASSWORD}
    ${TEST_DEMO_USER}                   Get Environment Variable    TEST_DEMO_USER
    Set Global Variable                 ${TEST_DEMO_USER}
    Log to Console                      Demo user is ${TEST_DEMO_USER}
    ${TEST_DEMO_PASSWORD}               Get Environment Variable    TEST_DEMO_PASSWORD
    Set Global Variable                 ${TEST_DEMO_PASSWORD}
    Set Global Variable                 ${YEAR}
    Set Global Variable                 ${NEXT_YEAR}
    ${DOWNLOADS}                        Get Download Directory
    Set Global Variable                 ${DOWNLOADS}

Standard Suite Setup
    Initialize Variables
    Clear Downloads
    Remove Work Files

Standard Suite Teardown
    Log to Console                      Test suite completed.
