*** Keywords ***
Lock Period
    [Arguments]                         ${period}
    Click Element                       //tr[@id="Period ${period}"]//*[@title="Lock period"]

Select Period
    [Documentation]                     Assume we have just selected database. Now select the given period.
    [Arguments]                         ${from}         ${to}
    Wait Until Page Contains Element    period-${from}-${to}
    Wait Until Element Is Enabled       //*[@id="period-${from}-${to}"]//button
    Click Element                       //*[@id="period-${from}-${to}"]//button
    Wait Until Page Contains Element    css:.BalanceTable

Create Period
    [Arguments]                         ${start}        ${end}
    Go To Tools
    Select Tool                         Periods
    Click Tool Icon                     Create Period

    Click Element                       startDate
    Press Keys                          None            CTRL+a
    Press Keys                          None            BACKSPACE
    Input Text                          startDate       ${start}

    Click Element                       endDate
    Press Keys                          None            CTRL+a
    Press Keys                          None            BACKSPACE
    Input Text                          endDate         ${end}

    Click Element                       OK
    Should Contain Table Cells 2-3     ${start}        ${end}
