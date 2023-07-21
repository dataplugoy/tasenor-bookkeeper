import { haveStore } from '@dataplug/tasenor-common'
import React from 'react'

function withStore(Component) {
  function ComponentWithStoreProp(props) {
    const store = haveStore()
    return (
      <Component {...props} store={store}/>
    )
  }

  return ComponentWithStoreProp
}

export default withStore
