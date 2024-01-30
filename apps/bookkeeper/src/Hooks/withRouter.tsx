import React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

/**
 * Helper to access router stuff in old components.
 */
function withRouter(Component) {
  function ComponentWithRouterProp(props) {
    const location = useLocation()
    const navigate = useNavigate()
    const params = useParams()

    return (
      <Component {...props} location={location} params={params} navigate={navigate}/>
    )
  }

  return ComponentWithRouterProp
}

export default withRouter
