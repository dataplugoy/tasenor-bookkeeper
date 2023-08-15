*** Keywords ***
Select Default Database
    [Documentation]                     Got to the home page and select first period of first database.
    ${db}                               Current DB
    ${period}                           Current Period
    ${already_there}                    Evaluate            ${db}!=None and ${period}!=None
    Return From Keyword If              ${already_there}
    Go To Dashboard
    Click Element                       1
    Click Element                       A

Select Database
    [Documentation]                     Select the given database.
    [Arguments]                         ${name}
    Go To Dashboard
    Click Element                       //*[contains(@class, "DatabaseList")]//*[text()='${name}']

Create Database
    [Documentation]                     Create new Database with the given name, company and schema.
    [Arguments]                         ${name}            ${company}          ${schema}
    Go To Tools
    Click Element                       New Database
    Click Element                       //label[text()="Accounting Scheme"]/..
    Wait Until Element Is Enabled       //*[@data-value='${schema}']
    Click Element                       //*[@data-value='${schema}']
    Input Text                          database-name       ${name}
    Input Text                          company-name        ${company}
    Input Text                          company-number      12345678-9
    Click Element                       OK
    Wait For Title                      Periods

Create Finnish Database
    [Documentation]                     Create new Database with the given name, company and schema.
    [Arguments]                         ${name}            ${company}          ${schema}
    Go To Tools
    Click Element                       New Database
    Click Element                       //label[text()="Tilikartta"]/..
    Wait Until Element Is Enabled       //*[@data-value='${schema}']
    Click Element                       //*[@data-value='${schema}']
    Input Text                          company-name        ${company}
    Input Text                          company-number      12345678-9
    Press Keys                          database-name       CTRL+A
    Press Keys                          None                BACKSPACE
    Input Text                          database-name       ${name}
    Click Element                       OK
    Wait For Title                      Tilikaudet

Download Database
    [Documentation]                     Download database backup.
    [Arguments]                         ${name}
    Go To Tools
    Wait Until Element Is Enabled       //*[text()='${name}']/../../..//*[text()='Download' or text()='Lataa']
    Click Element                       //*[text()='${name}']/../../..//*[text()='Download' or text()='Lataa']
    ${path}                             Get Database Download File
    Wait for Downloaded File            ${path}
