import { useLocation, useNavigate } from 'react-router-dom'
import { MenuState } from './MenuState'

export const useNav = (): MenuState => {
  const location = useLocation()
  const navigate = useNavigate()
  return new MenuState(location, navigate)
}
