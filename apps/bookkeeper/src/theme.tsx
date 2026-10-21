import { alpha, createTheme } from '@mui/material'
import '@fontsource-variable/public-sans'

/**
 * Colors of the ledger: pale columnar paper, ink and the Tasenor navy, with the coin yellow of the logo as a marker.
 * Same palette as Tasenor Data Exchange.
 */
export const ledger = {
  canvas: '#EEF1EC',
  paper: '#FBFCFA',
  rule: '#D3DAD2',
  ruleStrong: '#B9C3BA',
  ink: '#1D2622',
  muted: '#5D6A63',
  navy: '#1F3F8F',
  navyDark: '#152C66',
  navyLight: '#E3E9F6',
  navySoft: '#9FB0D8',
  coin: '#E2C33A',
  debit: '#2E6B4F',
  credit: '#A43C30',
  amber: '#8F6310',
}

export const fonts = {
  sans: '"Public Sans Variable", "Public Sans", system-ui, sans-serif',
}

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#4F6DB5',
      main: ledger.navy,
      dark: ledger.navyDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      light: '#4F6DB5',
      main: ledger.navy,
      dark: ledger.navyDark,
      contrastText: '#FFFFFF',
    },
    success: {
      main: ledger.debit,
    },
    error: {
      main: ledger.credit,
    },
    warning: {
      main: ledger.amber,
    },
    text: {
      primary: ledger.ink,
      secondary: ledger.muted,
    },
    divider: ledger.rule,
    background: {
      default: ledger.canvas,
      paper: ledger.paper,
    },
    action: {
      hover: alpha(ledger.navy, 0.05),
      selected: ledger.navyLight,
    },
  },

  shape: {
    borderRadius: 6,
  },

  typography: {
    fontFamily: fonts.sans,
    fontSize: 14,
    h4: { fontWeight: 650, letterSpacing: '-0.01em' },
    h5: { fontWeight: 650, fontSize: '1.25rem', letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, fontSize: '1.05rem' },
    subtitle1: { fontWeight: 600, fontSize: '1rem' },
    body1: { fontSize: '0.95rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.45 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--ledger-canvas': ledger.canvas,
          '--ledger-paper': ledger.paper,
          '--ledger-rule': ledger.rule,
          '--ledger-rule-strong': ledger.ruleStrong,
          '--ledger-ink': ledger.ink,
          '--ledger-muted': ledger.muted,
          '--ledger-navy': ledger.navy,
          '--ledger-navy-light': ledger.navyLight,
          '--ledger-coin': ledger.coin,
          '--ledger-credit': ledger.credit,
        },
        body: {
          fontVariantNumeric: 'tabular-nums',
        },
        a: {
          color: ledger.navy,
          textUnderlineOffset: '0.15em',
        },
        ':focus-visible': {
          outline: `2px solid ${ledger.navy}`,
          outlineOffset: '2px',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: ledger.rule,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          borderColor: ledger.rule,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          paddingBottom: 0,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
        outlined: {
          borderColor: ledger.ruleStrong,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '&.toggle-on': {
            backgroundColor: ledger.navyLight,
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        // Avatars in lists show keyboard shortcuts. Draw them as keycaps.
        root: {
          width: 26,
          height: 26,
          fontSize: '0.8rem',
          fontWeight: 600,
          borderRadius: 5,
          color: ledger.muted,
          backgroundColor: '#FFFFFF',
          border: `1px solid ${ledger.ruleStrong}`,
          boxShadow: `0 1px 0 ${ledger.rule}`,
        },
      },
    },
    MuiListItemAvatar: {
      styleOverrides: {
        root: {
          minWidth: 42,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '1px 8px',
          paddingTop: 6,
          paddingBottom: 6,
          '&.Mui-selected': {
            backgroundColor: ledger.navyLight,
            boxShadow: `inset 3px 0 0 ${ledger.coin}`,
            '& .MuiListItemText-primary': {
              fontWeight: 600,
            },
            '& .MuiAvatar-root': {
              color: '#FFFFFF',
              backgroundColor: ledger.navy,
              borderColor: ledger.navy,
              boxShadow: 'none',
            },
          },
          '&.Mui-selected:hover': {
            backgroundColor: alpha(ledger.navy, 0.14),
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: ledger.navyLight,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${ledger.rule}`,
        },
        head: {
          fontWeight: 600,
          fontSize: '0.8rem',
          color: ledger.muted,
          backgroundColor: ledger.paper,
          borderBottom: `2px solid ${ledger.ruleStrong}`,
        },
        sizeSmall: {
          paddingTop: 4,
          paddingBottom: 4,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.Mui-selected, &.Mui-selected:hover': {
            backgroundColor: ledger.navyLight,
          },
        },
        hover: {
          '&:hover': {
            backgroundColor: `${alpha(ledger.navy, 0.04)} !important`,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: ledger.coin,
          height: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          '&.Mui-selected': {
            color: ledger.ink,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: ledger.ruleStrong,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: ledger.muted,
          '&.Mui-focused': {
            color: ledger.navy,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          border: `1px solid ${ledger.rule}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 650,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(29, 38, 34, 0.35)',
        },
      },
    },
  },
})
