*** Keywords ***

Ensure Browser Is Open
    [Documentation]                     Check if the browser is not open and open it.
    Run Keyword If                      '${CI}'=='True'    Start Virtual Display               1920    1080
    ${ret}                              Run Keyword And Return Status       Execute Javascript      return 1
    Return From Keyword If              ${ret}
    Open Browser                        ${TEST_BASE_URL}/      Chrome
    Maximize Browser Window
    Wait Until Element is Visible       css:.logo

Login As Superuser
    Login As Admin

Login As Admin
    Login As                            ${TEST_ADMIN_USER}      ${TEST_ADMIN_PASSWORD}

Login As User
    Login As                            ${TEST_USER}      ${TEST_PASSWORD}

Login As Demo User
    Login As                            ${TEST_DEMO_USER}      ${TEST_DEMO_PASSWORD}

Login As QA User
    Login As                            ${TEST_QA_USER}      ${TEST_QA_PASSWORD}

Login As
    [Arguments]                         ${username}     ${password}
    Ensure Browser Is Open
    ${current_user}                     Get Currently Logged User
    Return From Keyword If              '${current_user}' == '${username}'
    Log to Console                      Want to be ${username} but we are ${current_user}
    Run Keyword If                      '${current_user}' != 'None'         Logout
    Go To Login
    Fill in Login                       ${username}     ${password}
    Wait Until App Loaded
    Log to Console                      Logged in as ${username}
    Change Language                     en

Logout
    Log to Console                      Logging out
    Click Element                       LogoutMenu
    Wait Until Element is Visible       css:.not-logged-in

Go To Starting URL
    Go To                               ${TEST_BASE_URL}/

Go To Login
    Go To Starting URL
    Wait Until Element is Visible       css:.LoginPage

Go To Dashboard
    Wait Until No Loading Shadow
    Wait Until App Loaded
    Sleep                               500milliseconds
    Wait Until Element is Visible       ⌂Menu
    Click Element                       ⌂Menu
    Wait Until Element is Visible       css:.Dashboard
    Wait Until No Loading Shadow

Go To Transactions
    ${page}                             Current Page
    ${already_there}                    Evaluate            '${page}'=='txs'
    Return From Keyword If              ${already_there}
    Wait Until No Loading Shadow
    Wait Until Element is Visible       TransactionsMenu
    Click Element                       TransactionsMenu
    Wait Until Element is Visible       css:.TransactionsPage
    Wait Until No Loading Shadow

Go To Reports
    ${page}                             Current Page
    ${already_there}                    Evaluate            '${page}'=='report'
    Return From Keyword If              ${already_there}
    Wait Until No Loading Shadow
    Wait Until Element is Visible       ReportsMenu
    Click Element                       ReportsMenu
    Wait Until Page Contains Element    css:.ReportsPage
    Wait Until No Loading Shadow

Go To Accounts
    ${page}                             Current Page
    ${already_there}                    Evaluate            '${page}'=='account'
    Return From Keyword If              ${already_there}
    Wait Until No Loading Shadow
    Wait Until Element is Visible       AccountsMenu
    Click Element                       AccountsMenu
    Wait Until Element is Visible       css:.AccountsPage
    Wait Until No Loading Shadow

Go To Tools
    ${page}                             Current Page
    ${already_there}                    Evaluate            '${page}'=='tools'
    Return From Keyword If              ${already_there}
    Wait Until No Loading Shadow
    Wait Until Element is Visible       ToolsMenu
    Click Element                       ToolsMenu
    Wait Until Element is Visible       css:.ToolsForDatabasesPage
    Wait Until No Loading Shadow

Go To Shop
    ${page}                             Current Page
    ${already_there}                    Evaluate            '${page}'=='shop'
    Return From Keyword If              ${already_there}
    Wait Until Element is Visible       ShopMenu
    Click Element                       ShopMenu
    Wait For Title                      Available Plugins

Go To Data
    ${page}                             Current Page
    ${already_there}                    Evaluate            '${page}'=='data'
    Wait Until No Loading Shadow
    Wait Until Element is Visible       DataMenu
    Click Element                       DataMenu
    Wait Until Element is Visible       css:.ImportsPage
    Wait Until No Loading Shadow

Select Tool
    [Arguments]                         ${tool}
    Wait Until Element is Visible       //*[@role="button"]//*[text()='${tool}']
    Click Element                       //*[@role="button"]//*[text()='${tool}']

Click Tool Icon
    [Arguments]                         ${icon}
    Wait Until Element is Visible       //*[contains(@class, "MainTopPanel")]//*[@id="${icon}"]
    Click Element                       //*[contains(@class, "MainTopPanel")]//*[@id="${icon}"]

Go To Admin
    ${page}                             Current Page
    ${already_there}                    Evaluate            '${page}'=='admin'
    Return From Keyword If              ${already_there}
    Wait Until No Loading Shadow
    Wait Until Element is Visible       AdminMenu
    Click Element                       AdminMenu
    Wait Until Element is Visible       css:.AdminToolsList
    Wait Until No Loading Shadow

Go To Admin / Plugins
    Go to Admin
    Click Element                       1
    Wait For Title                      Plugins

Go To Admin / Users
    Go to Admin
    Click Element                       2
    Wait For Title                      User Tools

Get Currently Logged User
    [Documentation]                     Find out the name of the currently logged user from the JWT token stored to local store.
    ${token}                            Execute Javascript      return localStorage.getItem('token')
    Return From Keyword If              '${token}' == 'None'
    ${jwt}                              Parse JWT Token         ${token}
    Return From Keyword If              not ${jwt}
    Return From Keyword                 ${jwt}[data][owner]

Wait For Title
    [Documentation]                     Wait until page subtitle is visible.
    [Arguments]                         ${title}
    Wait Until Element is Visible       //*[contains(@class, "Title")]/h5[text() = '${title}']      timeout=10

Wait Until App Loaded
    Wait Until Page Contains Element    css:.logged-in
