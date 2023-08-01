import React from 'react'
import { observer } from 'mobx-react'
import { setup } from '@dataplug/tasenor-testing'
import { AccountNumber, TasenorElement } from '@tasenor/common'
import { RISP } from '@tasenor/common-ui'
import { makeObservable, observable } from 'mobx'

const values = makeObservable({ value: { } }, { value: observable })

const PageRuleEditor = (): JSX.Element => {

  const element: TasenorElement = {
    type: 'flat',
    elements: [
      {
        type: 'box',
        title: 'Single Frame Full Editor',
        elements: [
          {
            type: 'ruleEditor',
            name: 'demo',
            defaultValue: {
              text: 'Text proposal'
            },
            config: {
              language: 'en'
            },
            actions: {
              onContinue: {
                type: 'post',
                url: '',
                objectWrapLevel: 0
              },
              onCreateRule: {
                type: 'post',
                url: 'rule',
                objectWrapLevel: 0
              }
            },
            cashAccount: '6677' as AccountNumber,
            lines: [{
              line: 1,
              text: 'Text File Line number 1 -2,60€',
              columns: {
                number: '1',
                amount: -2.60 as unknown as string, // TODO: Drop conversion once supported.
                addtionalInfo: 'Foo bar',
                silly: 'A',
                _totalAmountField: -2.6 as unknown as string, // TODO: Drop conversion once supported.
                _textField: 'Text File Line number 1'
              }
            }, {
              line: 2,
              text: 'Text File Line number 2 4,00€',
              columns: {
                number: '2',
                amount: 4.00 as unknown as string, // TODO: Drop conversion once supported.
                addtionalInfo: 'Baz',
                silly: 'V',
                _totalAmountField: 4.0 as unknown as string, // TODO: Drop conversion once supported.
                _textField: 'Text File Line number 2'
              }
            }],
            options: {
              parser: 'csv',
              numericFields: ['amount'],
              insignificantFields: ['silly'],
              requiredFields: [],
              totalAmountField: 'amount',
              textField: 'additionalinfo'
            }
          }
        ]
      }
    ]
  }

  return <div>
    <RISP setup={setup} element={element} values={values.value}/>
      <pre>
      {JSON.stringify(values.value, null, 2)}
      </pre>
  </div>
}

export default observer(PageRuleEditor)
