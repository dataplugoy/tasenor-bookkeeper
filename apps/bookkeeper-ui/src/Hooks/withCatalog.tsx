import { haveCatalog } from '@dataplug/tasenor-common'
import React from 'react'

function withCatalog(Component) {
  function ComponentWithCatalogProp(props) {
    const catalog = haveCatalog()
    return (
      <Component {...props} store={catalog}/>
    )
  }

  return ComponentWithCatalogProp
}

export default withCatalog
