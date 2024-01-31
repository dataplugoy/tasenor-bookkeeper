import { createTheme } from '@mui/material'
import { blueGrey, amber, brown } from '@mui/material/colors'

export const light = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: brown[300],
      main: brown[400],
      dark: brown[500],
    },
    secondary: {
      light: amber[700],
      main: amber[800],
      dark: amber[900],
    },
    text: {
      primary: brown[500],
      secondary: brown[700],
    },
    background: {
      paper: 'rgb(252,249,244)',
      default: brown[600],
    },
  },
})

export const dark = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: blueGrey[500],
    },
    secondary: {
      main: amber[900],
    },
    background: {
      paper: 'rgb(252,249,244)',
    },
  },
})
