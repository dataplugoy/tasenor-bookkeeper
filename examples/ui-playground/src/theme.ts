import { createTheme } from '@mui/material'
import { green, blue } from '@mui/material/colors'

const theme = createTheme({
  palette: {
    primary: {
      main: green[400]
    },
    secondary: {
      main: blue[500]
    }
  }
})

export default theme
