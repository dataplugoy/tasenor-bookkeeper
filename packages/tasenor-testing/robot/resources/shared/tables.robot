*** Keywords ***

Should Contain Table Row 2
    [Arguments]                         ${td1}  ${td2}
    Page Should Contain Element         //tr[td[1][.//text()='${td1}']][td[2][.//text()='${td2}']]

Should Contain Table Row 3
    [Arguments]                         ${td1}  ${td2}  ${td3}
    Page Should Contain Element         //tr[td[1][.//text()='${td1}']][td[2][.//text()='${td2}']][td[3][.//text()='${td3}']]

Should Contain Table Cells 2-3
    [Arguments]                         ${td2}  ${td3}
    Page Should Contain Element         //tr[td[2][.//text()='${td2}']][td[3][.//text()='${td3}']]

Should Contain Table Row 4
    [Arguments]                         ${td1}  ${td2}  ${td3}  ${td4}
    Page Should Contain Element         //tr[td[1][.//text()='${td1}']][td[2][.//text()='${td2}']][td[3][.//text()='${td3}']][td[4][.//text()='${td4}']]

Should Contain Table Row 5
    [Arguments]                         ${td1}  ${td2}  ${td3}  ${td4}  ${td5}
    Page Should Contain Element         //tr[td[1][.//text()='${td1}']][td[2][.//text()='${td2}']][td[3][.//text()='${td3}']][td[4][.//text()='${td4}']][td[5][.//text()='${td5}']]

Should Contain Table Row 6
    [Arguments]                         ${td1}  ${td2}  ${td3}  ${td4}  ${td5}  ${td6}
    Page Should Contain Element         //tr[td[1][.//text()='${td1}']][td[2][.//text()='${td2}']][td[3][.//text()='${td3}']][td[4][.//text()='${td4}']][td[5][.//text()='${td5}']][td[6][.//text()='${td6}']]

Should Contain Table Cells 3-5
    [Arguments]                         ${td3}  ${td4}  ${td5}
    Page Should Contain Element         //tr[td[3][.//text()='${td3}']][td[4][.//text()='${td4}']][td[5][.//text()='${td5}']]
