import React from 'react'
import { RISP } from '@tasenor/common-ui'
import { setup } from '@dataplug/tasenor-testing'
import { TasenorElement } from '@tasenor/common'
import { makeObservable, observable } from 'mobx'
import { observer } from 'mobx-react'

const values = makeObservable({ value: { currency: null } }, { value: observable })

const PageCurrency = (): JSX.Element => {
  const element: TasenorElement = {
    type: 'flat',
    elements: [
      {
        type: 'html',
        html: 'Testing Currency Selector'
      },
      {
        type: 'currency',
        name: 'currency',
        actions: {}
      }
    ]
  }

  return <div>
    <RISP setup={setup} element={element} values={values.value}/>
      <pre>
      {JSON.stringify(values.value)}
      </pre>
  </div>
}

export default observer(PageCurrency)
