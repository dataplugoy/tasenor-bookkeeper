import React from 'react'
import { observer } from 'mobx-react'
import { TabNav } from '@tasenor/common-ui'

const PageTabs = (): JSX.Element => {

  return <div>
    <TabNav menu="tab" labels={{ 11: 'Item One', 22: 'Item Two', 33: 'Item Three' }}>
      <div>First Period</div>
      <div>Second Period</div>
      <div>Third Period</div>
    </TabNav>
  </div>
}

export default observer(PageTabs)
