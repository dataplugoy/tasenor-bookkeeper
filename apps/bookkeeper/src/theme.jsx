import { createTheme } from '@mui/material'
import { brown } from '@mui/material/colors'
import { blueGrey, deepPurple } from '@mui/material/colors'

export const light = createTheme({
  palette: {
    primary: {
      main: blueGrey[500],
    },
    secondary: {
      main: deepPurple[900],
    },
    text: {
      primary: brown[500],
      secondary: brown[700],
    },
    background: {
      paper: 'rgb(252,249,244)',
      default: '#000',
    },
  },
})

export const dark = createTheme({
  palette: {
    primary: {
      main: blueGrey[500],
    },
    secondary: {
      main: deepPurple[900],
    },
    background: {
      paper: 'rgb(252,249,244)',
    },
  },
})
