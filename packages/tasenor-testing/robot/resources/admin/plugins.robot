*** Variables ***

${PLUGIN_LIST}                            //*[contains(@class, "PluginList")]

*** Keywords ***
Install Plugin If Missing
    [Arguments]                         ${code}
    ${already_installed}                Run Keyword And Return Status       Element Should Be Visible       ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "RemovePlugin")]
    Return From Keyword If              ${already_installed}
    Install Plugin                      ${code}

Install Plugin
    [Arguments]                         ${code}     ${timeout}=${DEFAULT_INSTALL_TIMEOUT}
    Click Element                       ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "InstallPlugin")]
    Wait Until No Loading Shadow
    Wait Until Page Contains Element    ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "RemovePlugin")]

Remove Plugin
    [Arguments]                         ${code}      ${timeout}=${DEFAULT_INSTALL_TIMEOUT}
    Click Element                       ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "RemovePlugin")]
    Wait Until No Loading Shadow
    Wait Until Page Contains Element    ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "InstallPlugin")]
