*** Keywords ***
Clear Downloads
    Remove Files                        ${DOWNLOADS}/transactions-*-*.csv
    ${filename}                         Get Database Download File
    Remove Files                        ${filename}

Get Account Download File
    ${account}                          Current Account
    ${period}                           Current Period
    Return From Keyword                 ${DOWNLOADS}/transactions-${period}-${account}.csv

Check for Downloaded File
    [Arguments]                         ${path}
    Log to Console                      Waiting for file ${path}
    File Should Exist                   ${path}
    [Return]                            ${path}

Wait for Downloaded File
    [Arguments]                         ${path}
    Wait Until Keyword Succeeds         1 min    2 sec    Check for Downloaded File    ${path}

File Should Match
    [Arguments]                         ${path}         ${data}
    Compare Files                       ${path}         ${data}

Select File to Upload
    [Arguments]                         ${element}      ${path}
    ${root}                             Data Files Directory
    Choose File                         ${element}     ${root}/${path}

Get Database Download File
    ${filename}                         Replace String      ${TEST_COMPANY}             ${SPACE}        _
    ${date}                             Get Current Date    result_format=datetime
    ${month}                            Convert Date        ${date}                     %m
    ${day}                              Convert Date        ${date}                     %d
    Return From Keyword                 ${DOWNLOADS}/${filename}-${date.year}-${month}-${day}.tasenor
