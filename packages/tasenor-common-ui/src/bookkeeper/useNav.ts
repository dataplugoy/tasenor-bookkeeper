import { useLocation, useNavigate } from 'react-router-dom'
import { MenuState } from './MenuState'

export const useNav = (): MenuState => {
  const loc = useLocation()
  const nav = useNavigate()
  return new MenuState(loc, nav)
}
