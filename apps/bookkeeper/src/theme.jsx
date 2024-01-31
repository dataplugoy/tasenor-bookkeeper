import { createTheme } from '@mui/material'
import { blueGrey, deepPurple } from '@mui/material/colors'

export const light = createTheme({
  palette: {
    primary: {
      main: blueGrey[500],
    },
    secondary: {
      main: deepPurple[900],
    },
    background: {
      default: 'white',
      paper: 'white',
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
      default: 'white',
      paper: 'white',
    },
  },
})
