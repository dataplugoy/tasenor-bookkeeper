*** Keywords ***

Wait for Dialog
    [Documentation]                     Wait until dialog is visible with the text in the title.
    [Arguments]                         ${title}
    Wait Until Element is Visible       //*[@role="dialog"]//*[contains(@class, "MuiDialogTitle-root") and contains(text(),"${title}")]
