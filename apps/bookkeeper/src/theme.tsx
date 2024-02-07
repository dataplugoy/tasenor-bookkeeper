import { createTheme } from '@mui/material'
import { amber, brown, grey, blueGrey, deepOrange, red, teal } from '@mui/material/colors'

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
      light: teal[700],
      main: teal[800],
      dark: teal[900],
    },
    secondary: {
      light: blueGrey[700],
      main: blueGrey[800],
      dark: blueGrey[900],
    },
    error: {
      main: deepOrange.A400
    },
    text: {
      primary: brown[200],
      secondary: brown[300],
    },
    background: {
      paper: grey[900],
      default: grey[800],
    },
  },
})
