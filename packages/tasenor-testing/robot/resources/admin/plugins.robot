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
    Wait Until Page Contains Element    ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "InstallPlugin")]
    Scroll Element Into View            ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "InstallPlugin")]
    Wait Until Element is Visible       ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "InstallPlugin")]
    Click Element                       ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "InstallPlugin")]
    Wait Until Page Contains Element    ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "RemovePlugin")]

Remove Plugin
    [Arguments]                         ${code}      ${timeout}=${DEFAULT_INSTALL_TIMEOUT}
    Wait Until Page Contains Element    ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "RemovePlugin")]
    Scroll Element Into View            ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "RemovePlugin")]
    Wait Until Element is Visible       ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "RemovePlugin")]
    Click Element                       ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "RemovePlugin")]
    Wait Until Page Contains Element    ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "InstallPlugin")]
