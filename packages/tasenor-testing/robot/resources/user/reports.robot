*** Variables ***

${COLLECT_REPORT_JS}                    SEPARATOR=\n
...      const report = document.evaluate('//table[contains(@class, "ReportDisplayTable")]//tr', document.body, null, XPathResult.ANY_TYPE, null);
...      const result = [];
...      while (true) {
...        const line = report.iterateNext();
...        if (!line) break;
...        let texts = [];
...        const cells = document.evaluate('./td', line, null, XPathResult.ANY_TYPE, null);
...        while (true) {
...          const cell = cells.iterateNext();
...          if (!cell) break;
...          texts = texts.concat(cell.innerText.trim().split('\\n'));
...        }
...        result.push(texts);
...      }
...     return result;

*** Keywords ***
Select Report
    [Documentation]                     Go to the report with the given identifier like `balance-sheet` or `income-statement`.
    [Arguments]                         ${report}
    Go To Reports
    Click Element                       id:SelectReport ${report}
    Wait Until Page Contains Element    css:.EndOfReport.${report}

Gather Report Data
    ${data}                             Execute Javascript      ${COLLECT_REPORT_JS}
    Return From Keyword                 ${data}

Select Report Option
    [Documentation]                     Click toolbar icon from the report options.
    [Arguments]                         ${option}
    Wait Until Element is Enabled       css:#${option}
    Click Element                       css:#${option}
    Wait Until Page Contains Element    css:.EndOfReport.${option}-on

Toggle Report Option On
    [Documentation]                     Toggle toolbar icon from the report options if it is not already on.
    [Arguments]                         ${option}
    Wait Until Element is Enabled       css:#${option}
    ${c}                                Get Element Count            css:#${option}.toggle-on
    Return from Keyword If              ${c} > 0
    Click Element                       css:#${option}
    Wait Until Page Contains Element    css:.EndOfReport.${option}-on

Toggle Report Option Off
    [Documentation]                     Toggle toolbar icon from the report options if it is not already off.
    [Arguments]                         ${option}
    Wait Until Element is Enabled       css:#${option}
    ${c}                                Get Element Count            css:#${option}.toggle-off
    Return from Keyword If              ${c} > 0
    Click Element                       css:#${option}
    Wait Until Page Contains Element    css:.EndOfReport.${option}-off

Page Should Contain Report Line
    [Arguments]                         ${title}                    ${value}
    Page Should Contain Element         //*[contains(@class, "ReportDisplay")]//tr[contains(@class, "ReportLine")][.//*[text()="${title}"]][.//*[text()="${value}"]]

Verify Dataplug Balance Sheet
    [Arguments]                         ${year}     ${quarter}      ${expected}
    Login as Demo User
    Change Language                     fi
    Select Database                     dataplug
    Select Period                       ${year}-01-01               ${year}-12-31
    Select Report                       balance-sheet-detailed
    Run Keyword If                      ${quarter} != 4             Select Report Option                option-quarter${quarter}
    Run Keyword If                      ${quarter} == 4             Select Report Option                option-full
    ${data}                             Gather Report Data
    Report Should Match                 ${data}     ${expected}

Verify Dataplug Detailed Balance Sheet
    [Arguments]                         ${year}     ${quarter}      ${expected}
    Verify Dataplug Balance Sheet       ${year}     ${quarter}      ${expected}

Verify Dataplug Income Statement
    [Arguments]                         ${year}     ${quarter}      ${expected}
    Login as Demo User
    Change Language                     fi
    Select Database                     dataplug
    Select Period                       ${year}-01-01               ${year}-12-31
    Select Report                       income-statement-detailed
    Run Keyword If                      ${quarter} != 4             Select Report Option                option-quarter${quarter}
    Run Keyword If                      ${quarter} == 4             Select Report Option                option-full
    Toggle Report Option On             option-byTags
    ${data}                             Gather Report Data
    Report Should Match                 ${data}     ${expected}

Verify Dataplug Detailed Income Statement
    [Arguments]                         ${year}     ${quarter}      ${expected}
    Verify Dataplug Income Statement    ${year}     ${quarter}      ${expected}
