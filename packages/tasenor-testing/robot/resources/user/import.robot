*** Keywords ***
Create Import
    [Documentation]                     Create new named importer using the plugin.
    [Arguments]                         ${name}        ${plugin}
    Go To Data
    Click Element                       CreateImport
    Click Element                       //*[@name='handler']/..
    Wait Until Element Is Enabled       //*[@data-value='${plugin}']
    Click Element                       //*[@data-value='${plugin}']
    Input Text                          name            ${name}
    Click Element                       OK
    Wait Until Page Contains Element    //*[contains(@class,"ImportersList")]//*[text()='${name}']

Select Importer
    [Documentation]                     Select the named importer when on the import page.
    [Arguments]                         ${name}
    Click Element                       //*[contains(@class, "ImportersList")]//*[text()="${name}"]/../..
    Wait Until Page Contains            Process Name

Select Import
    [Documentation]                     Select the import process based on its title.
    [Arguments]                         ${name}
    Click Element                       //*[contains(@class, "ProcessTable")]//*[contains(text(),"${name}")]/../..
    Wait Until Page Contains            Duration:

Answer Import Dropdown
    [Documentation]                     Select the account with the given number from dropdown.
    [Arguments]                         ${number}        ${text}
    Wait Until Element Is Enabled       //*[text()="${text}"]/..
    Click Element                       //*[text()="${text}"]/..
    Scroll Element Into View            //*[@id="Account ${number}"]
    Click Element                       //*[@id="Account ${number}"]

Answer Import Radio
    [Documentation]                     Select the radio button related to label.
    [Arguments]                         ${answer}        ${text}
    Click Element                       //*[text()="${text}"]/../..//input[@value="${answer}"]
