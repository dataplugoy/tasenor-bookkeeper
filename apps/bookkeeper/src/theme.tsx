import { alpha, createTheme, Theme } from '@mui/material'
import '@fontsource-variable/libre-franklin'

/**
 * Visual identity: a bound ledger. Deep green binding for the application shell,
 * cool white paper for the working area, green ruling between rows, red ink for
 * errors and brass (taken from the Tasenor laurel logo) to mark where you are.
 */
interface Tokens {
  mode: 'light' | 'dark'
  binding: string // Application bar.
  bindingDeep: string // Shadows and pressed states on the bar.
  canvas: string // Behind the paper sheets.
  paper: string // Panels.
  rule: string // Table ruling and panel borders.
  ink: string // Primary text.
  inkSoft: string // Secondary text.
  green: string // Primary action colour.
  brass: string // Current location and highlights.
  red: string // Errors and negative attention.
}

const lightTokens: Tokens = {
  mode: 'light',
  binding: '#1f3b33',
  bindingDeep: '#152a24',
  canvas: '#e9eeea',
  paper: '#fcfdfc',
  rule: '#d6dfd9',
  ink: '#1c2421',
  inkSoft: '#56645e',
  green: '#2d5a4c',
  brass: '#a87a35',
  red: '#b3261e',
}

const darkTokens: Tokens = {
  mode: 'dark',
  binding: '#1b2f28',
  bindingDeep: '#0d1714',
  canvas: '#101916',
  paper: '#17221e',
  rule: '#2b3a34',
  ink: '#e3ebe6',
  inkSoft: '#9fb0a8',
  green: '#7fbfa7',
  brass: '#d9ab62',
  red: '#f08a80',
}

const FONT = '"Libre Franklin Variable", "Libre Franklin", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

function makeTheme(t: Tokens): Theme {
  const isDark = t.mode === 'dark'
  return createTheme({
    palette: {
      mode: t.mode,
      primary: {
        main: t.green,
        contrastText: isDark ? '#0d1714' : '#ffffff',
      },
      secondary: {
        main: t.brass,
        contrastText: isDark ? '#1a1206' : '#ffffff',
      },
      error: {
        main: t.red,
      },
      text: {
        primary: t.ink,
        secondary: t.inkSoft,
      },
      divider: t.rule,
      background: {
        paper: t.paper,
        default: t.canvas,
      },
      action: {
        hover: alpha(t.green, isDark ? 0.10 : 0.06),
        selected: alpha(t.brass, isDark ? 0.18 : 0.14),
      },
    },
    shape: {
      borderRadius: 6,
    },
    typography: {
      fontFamily: FONT,
      fontSize: 14,
      h4: { fontWeight: 650, letterSpacing: '-0.01em' },
      h5: { fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.005em' },
      h6: { fontWeight: 600, fontSize: '1.05rem' },
      subtitle1: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--ledger-binding': t.binding,
            '--ledger-binding-deep': t.bindingDeep,
            '--ledger-canvas': t.canvas,
            '--ledger-paper': t.paper,
            '--ledger-rule': t.rule,
            '--ledger-ink': t.ink,
            '--ledger-ink-soft': t.inkSoft,
            '--ledger-green': t.green,
            '--ledger-brass': t.brass,
            '--ledger-red': t.red,
          },
          body: {
            fontFeatureSettings: '"tnum" 1, "lnum" 1',
          },
          a: {
            color: t.green,
            textDecorationColor: alpha(t.green, 0.4),
            textUnderlineOffset: '0.2em',
          },
          'a:hover': {
            textDecorationColor: 'currentColor',
          },
          ':focus-visible': {
            outline: `2px solid ${t.brass}`,
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
            borderColor: t.rule,
          },
        },
      },
      MuiCard: {
        defaultProps: {
          variant: 'outlined',
        },
        styleOverrides: {
          root: {
            borderColor: t.rule,
            backgroundColor: t.paper,
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
            paddingLeft: 14,
            paddingRight: 14,
          },
          outlined: {
            borderColor: alpha(t.green, 0.45),
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            '&.toggle-on': {
              backgroundColor: alpha(t.brass, 0.16),
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
            color: t.inkSoft,
            backgroundColor: t.paper,
            border: `1px solid ${t.rule}`,
            boxShadow: `0 1px 0 ${t.rule}`,
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
              backgroundColor: alpha(t.brass, isDark ? 0.16 : 0.12),
              boxShadow: `inset 3px 0 0 ${t.brass}`,
              '& .MuiListItemText-primary': {
                fontWeight: 600,
              },
              '& .MuiAvatar-root': {
                color: isDark ? '#1a1206' : '#ffffff',
                backgroundColor: t.brass,
                borderColor: t.brass,
                boxShadow: 'none',
              },
            },
            '&.Mui-selected:hover': {
              backgroundColor: alpha(t.brass, isDark ? 0.22 : 0.18),
            },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: alpha(t.brass, isDark ? 0.16 : 0.12),
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${t.rule}`,
          },
          head: {
            fontWeight: 600,
            fontSize: '0.78rem',
            color: t.inkSoft,
            backgroundColor: t.paper,
            borderBottom: `2px solid ${alpha(t.green, isDark ? 0.5 : 0.35)}`,
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
              backgroundColor: alpha(t.brass, isDark ? 0.18 : 0.13),
            },
          },
          hover: {
            '&:hover': {
              backgroundColor: `${alpha(t.green, isDark ? 0.08 : 0.045)} !important`,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: t.brass,
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            '&.Mui-selected': {
              color: t.ink,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? alpha('#000', 0.15) : '#ffffff',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#3b4d46' : '#c5d1ca',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
          },
          outlined: {
            borderColor: t.rule,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            border: `1px solid ${t.rule}`,
            boxShadow: '0 24px 48px -12px rgba(10, 30, 24, 0.35)',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderBottom: `1px solid ${t.rule}`,
            marginBottom: 12,
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
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: t.bindingDeep,
            fontSize: '0.75rem',
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: alpha(t.bindingDeep, 0.45),
          },
        },
      },
    },
  })
}

export const light = makeTheme(lightTokens)
export const dark = makeTheme(darkTokens)
