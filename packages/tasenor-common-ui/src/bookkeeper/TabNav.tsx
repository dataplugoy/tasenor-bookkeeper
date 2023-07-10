import { Box, Paper, Tab, Tabs } from '@mui/material'
import React from 'react'
import { useNavigation } from './Hooks'

export interface TabPanelProps {
  children: JSX.Element
  value: number
  index: number
}

export const TabPanel = (props: TabPanelProps): JSX.Element => {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

function a11yProps(index) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`
  }
}

export interface TabsProps {
  menu: string
  labels: Record<string, string>
  children: JSX.Element[]
}

/**
 * Tab navigation using the navigation hook directly.
 *
 * @param props.menu Name of the variable taken from menu to select tab.
 * @param props.labels Mapping from menu values to tab display names.
 * @returns
 */
export const TabNav = (props: TabsProps): JSX.Element => {
  const { menu, labels, children } = props
  const nav = useNavigation()

  const indices = Object.keys(labels)
  const onChange = (event, idx) => {
    nav.go({ [menu]: indices[idx] })
  }

  const current = Math.max(0, indices.indexOf(`${nav.get(menu)}`))

  return <Paper>
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={current} onChange={(event, value) => onChange(event, value)}>
        {
          Object.values(labels).map((label, idx) => (
            <Tab key={idx} label={label} {...a11yProps(idx)} />
          ))
        }
      </Tabs>
    </Box>
    {
      children.map((child, idx) => (
        <TabPanel key={idx} value={current} index={idx}>
          {child}
        </TabPanel>)
      )
    }
  </Paper>
}
