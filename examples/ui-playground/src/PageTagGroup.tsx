import React from 'react'
import { RISP } from '@tasenor/common-ui'
import { setup } from '@dataplug/tasenor-testing'
import { TasenorElement, Tag, TagType } from '@tasenor/common'
import { makeObservable, observable } from 'mobx'
import { observer } from 'mobx-react'

const values = makeObservable({ value: { tags: [], tags2: [] } }, { value: observable })

const PageTagGroup = (): JSX.Element => {
  const element: TasenorElement = {
    type: 'flat',
    elements: [
      {
        type: 'html',
        html: 'Testing Tag Selector'
      },
      {
        type: 'tags',
        name: 'tags',
        single: false,
        types: ['Operator' as TagType],
        actions: {}
      },
      {
        type: 'html',
        html: 'Testing Tag Selector with Fixed List'
      },
      {
        type: 'tags',
        single: true,
        name: 'tags2',
        label: 'This is a label for tags',
        options: ['Nordnet' as Tag],
        add: [],
        actions: {}
      },
      {
        type: 'html',
        html: 'Testing Account Selector'
      },
      {
        type: 'account',
        name: 'account',
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

export default observer(PageTagGroup)
