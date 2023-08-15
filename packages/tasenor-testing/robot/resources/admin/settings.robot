*** Variables ***

${SETTINGS_LIST}                        //*[contains(@class, "SettingsList")]

*** Keywords ***
Go To Settings
    Click Element                       Edit Settings
    Wait For Title                      Personal Information

Go To System Settings
    Go To Settings
    Click Element                       3
    Wait For Title                      System Settings

Select Settings
    [Arguments]                         ${name}
    Click Element                       ${SETTINGS_LIST}//*[text()="${name}"]
    Wait Until Element is Visible       css:.PluginSettings

Toggle Settings
    [Arguments]                         ${name}
    Click Element                       //*[@name='${name}'][@type='checkbox']

Input Setting
    [Arguments]                         ${name}                     ${value}
    Click Element                       //*[@name='${name}']/..
    Press Keys                          None            CTRL+a
    Press Keys                          None            BACKSPACE
    Input Text                          //*[@name='${name}']        ${value}

Save Settings
    Sleep                               100ms
    Click Element                       //*[@type='button'][text()='Save']

Save System Settings
    Save Settings
    Wait for Info Message               System settings saved.
