import { createTheme } from '@mui/material'
import { blueGrey, deepPurple } from '@mui/material/colors'

const theme = createTheme({
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

export default theme
