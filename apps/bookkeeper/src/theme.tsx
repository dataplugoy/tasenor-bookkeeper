import { createTheme } from '@mui/material'
import { amber, brown, grey, blueGrey, deepOrange, red } from '@mui/material/colors'

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
    error: {
      main: red[700]
    },
    text: {
      primary: brown[500],
      secondary: brown[700],
    },
    background: {
      paper: 'rgb(252,249,244)',
      default: 'white',
    },
  },
})

export const dark = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: amber[700],
      main: amber[800],
      dark: amber[900],
    },
    secondary: {
      light: blueGrey[200],
      main: blueGrey[300],
      dark: blueGrey[400],
    },
    error: {
      main: deepOrange.A400
    },
    text: {
      primary: brown[200],
      secondary: brown[300],
    },
    background: {
      paper: grey[800],
      default: grey[800],
    },
  },
})
