import { createTheme } from '@mui/material'
import { amber, brown, grey, blueGrey, deepOrange, red, teal } from '@mui/material/colors'

export const light = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: brown[400],
      main: brown[700],
      dark: brown[900],
    },
    secondary: {
      light: amber[700],
      main: amber[900],
      dark: '#e65100',
    },
    error: {
      main: red[700]
    },
    text: {
      primary: grey[900],
      secondary: grey[700],
    },
    background: {
      paper: '#ffffff',
      default: '#fafafa',
    },
  },
  typography: {
    subtitle1: {
      fontWeight: 'bold'
    }
  },
})

export const dark = createTheme({
  palette: {
    mode: 'dark',
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
      primary: brown[50],
      secondary: brown[200],
    },
    background: {
      paper: grey[900],
      default: grey[800],
    },
  },
  typography: {
    subtitle1: {
      fontWeight: 'bold'
    }
  },
})
