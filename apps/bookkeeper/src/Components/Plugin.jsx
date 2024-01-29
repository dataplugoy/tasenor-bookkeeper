import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { withTranslation, Trans } from 'react-i18next'
import { haveSettings } from '@tasenor/common'
import { Card, CardActions, CardContent, Button, CardHeader, Chip, Box } from '@mui/material'
import PluginIcon from './PluginIcon'
import { purple, brown, cyan, orange, pink, lime, green, yellow, blue, grey } from '@mui/material/colors'
import { AllInclusive, Build, Flag, FormatPaint, HelpOutline, LibraryBooks, PieChart, TrendingUp, Computer, Money, Dns, Storage } from '@mui/icons-material'
import Catalog from '../Stores/Catalog'
import PluginPrice from './PluginPrice'
import Store from '../Stores/Store'
import withRouter from '../Hooks/withRouter'
import withCatalog from '../Hooks/withCatalog'
import withStore from '../Hooks/withStore'

const PluginUse = ({ use }) => {
  const colors = {
    ui: yellow[700],
    backend: blue[900],
    both: green[800]
  }
  const icons = {
    ui: PieChart,
    backend: Dns,
    both: AllInclusive
  }
  const backgroundColor = colors[use] || grey[500]
  const Icon = icons[use] || HelpOutline
  return (
    <Chip icon={<Icon />} size="small" color="primary" style={{ backgroundColor }} label={use} />
  )
}
PluginUse.propTypes = {
  use: PropTypes.string,
}

const PluginType = ({ type }) => {
  const colors = {
    language: pink[500],
    tool: blue[500],
    import: orange[500],
    report: purple[500],
    scheme: cyan[300],
    service: lime[700],
    currency: yellow[700],
    data: lime[400],
    unused3: brown[700],
  }
  const icons = {
    currency: Money,
    language: Flag,
    tool: FormatPaint,
    import: Build,
    report: TrendingUp,
    scheme: LibraryBooks,
    service: Computer,
    data: Storage
  }
  const backgroundColor = colors[type] || grey[600]
  const Icon = icons[type] || HelpOutline
  return (
    <Chip icon={<Icon />} size="small" color="primary" style={{ backgroundColor }} label={type} />
  )
}
PluginType.propTypes = {
  type: PropTypes.string,
}

@withRouter
@withTranslation('translations')
@withCatalog
@withStore
@observer
class Plugin extends Component {

  render() {
    const { plugin, t, admin, compact, subscribed, price, catalog, store } = this.props
    const settings = haveSettings()
    const isAvailable = !!plugin.availableVersion
    const isInstalled = !!plugin.installedVersion
    const canSubscribe = !!price
    const lastVersion = plugin.availableVersion

    let subheader = this.props.subheader

    if (admin) {
      subheader = `${t('Available')}: ${lastVersion ? `v${lastVersion}` : '—'} ${plugin.installedVersion ? t('Installed') + ': v' + plugin.installedVersion : ''}`
    }

    return (
      <Card id={plugin.code} data-cy={`plugin-${plugin.code}`} style={{ margin: '0.5rem', width: '28rem' }}>
        <CardHeader
          className="Plugin"
          avatar={<PluginIcon svg={plugin.icon}/>}
          title={<span>
            {plugin.title}
            {!compact && <><br/> <PluginUse use={plugin.use} /> <PluginType type={plugin.type}/></>}
          </span>}
          subheader={subheader}
          />
        {
          !compact &&
          <CardContent>
            {plugin.description}
          </CardContent>
        }
        {
          !compact &&
          <CardActions>
            {admin && !isInstalled && isAvailable && <Button data-cy="button-Install" color="primary" size="small" onClick={() => catalog.install(plugin)}>
              <Trans>Install</Trans>
            </Button>}
            {admin && isInstalled && <Button data-cy="button-Remove" variant="outlined" color="secondary" size="small" onClick={() => catalog.uninstall(plugin)}>
              <Trans>Remove</Trans>
            </Button>}
            {!admin && !subscribed && canSubscribe && <Button data-cy="button-Subscribe" variant="outlined" color="primary" size="small" onClick={() => store.subscribe(plugin.code)}>
              <Trans>Subscribe</Trans>
            </Button>}

            {!admin && <Box sx={{ ml: 2 }}><PluginPrice currency={settings.getSystem('currency')} price={price} /></Box>}
          </CardActions>
        }
      </Card>
    )
  }
}

Plugin.propTypes = {
  admin: PropTypes.bool,
  compact: PropTypes.bool,
  t: PropTypes.func,
  catalog: PropTypes.instanceOf(Catalog),
  store: PropTypes.instanceOf(Store),
  plugin: PropTypes.object,
  price: PropTypes.object,
  subheader: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  subscribed: PropTypes.bool,
}
export default Plugin
