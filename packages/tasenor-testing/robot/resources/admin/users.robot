*** Variables ***

${USER_LIST}                            //*[contains(@class, "UserList")]

*** Keywords ***
Fill in Login
    [Arguments]                         ${username}     ${password}
    Input Text                          username        ${username}
    Input Password                      password        ${password}
    Click Element                       login

Fill in Registration
    [Arguments]                         ${username}     ${password}     ${email}
    Input Text                          full-name       ${username}
    Input Text                          email           ${email}
    Input Password                      password        ${password}
    Input Password                      password-again  ${password}
    Click Element                       submit

Fill in Admin Registration
    [Arguments]                         ${username}     ${password}     ${email}
    Input Text                          full-name       ${username}
    Input Text                          email           ${email}
    Input Password                      password        ${password}
    Input Password                      password-again  ${password}
    Click Element                       submit

Select User From List
    [Arguments]                         ${email}
    Click Element                       ${USER_LIST}//*[@id='user-${email}']
