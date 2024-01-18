*** Variables ***

${PLUGIN_LIST}                            //*[contains(@class, "PluginList")]
${SUBSCRIBED_LIST}                        //*[contains(@class, "Subscriptions")]

*** Keywords ***
Subscribe Plugin If Missing
    [Arguments]                         ${code}
    ${already_installed}                Run Keyword And Return Status       Element Should Be Visible       ${SUBSCRIBED_LIST}//*[@id="${code}"]//*[text()='Unsubscribe']
    Return From Keyword If              ${already_installed}
    Subscribe Plugin                    ${code}

Subscribe Plugin
    [Arguments]                         ${code}
    Wait Until Page Contains Element    ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "Subscribe")]
    Scroll Element Into View            ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "Subscribe")]
    Execute JavaScript                  window.scrollBy(0,200)
    Wait Until Element is Visible       ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "Subscribe")]
    Click Element                       ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "Subscribe")]
    Wait Until Page Contains Element    ${SUBSCRIBED_LIST}//*[@id="${code}"]//*[text()='Unsubscribe']

Unsubscribe Plugin
    [Arguments]                         ${code}
    Wait Until Page Contains Element    ${SUBSCRIBED_LIST}//*[@id="${code}"]//*[text()='Unsubscribe']
    Scroll Element Into View            ${SUBSCRIBED_LIST}//*[@id="${code}"]//*[text()='Unsubscribe']
    Execute JavaScript                  window.scrollBy(0,200)
    Wait Until Element is Visible       ${SUBSCRIBED_LIST}//*[@id="${code}"]//*[text()='Unsubscribe']
    Click Element                       ${SUBSCRIBED_LIST}//*[@id="${code}"]//*[text()='Unsubscribe']
    Wait Until Page Contains Element    ${PLUGIN_LIST}//*[@id="${code}"]//*[contains(@class, "Subscribe")]
