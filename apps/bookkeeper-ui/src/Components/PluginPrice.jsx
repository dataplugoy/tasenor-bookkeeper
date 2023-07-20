import React from 'react'
import { PropTypes } from 'prop-types'
import { Typography } from '@mui/material'
import { Trans } from 'react-i18next'
import { Money } from '@dataplug/tasenor-common-ui'

const PluginPrice = ({ price, currency }) => {
  let text, color
  if (!price) {
    text = <Trans>This plugin is not currently available.</Trans>
    color = 'error'
  } else {
    switch (price.model) {
      case 'COMPULSORY':
      case 'RECOMMENDED':
      case 'FREE':
        text = <Trans>Free of charge</Trans>
        color = 'secondary'
        break
      case 'SINGLE':
        text = <><Trans>Once off</Trans> <Money currency={currency} cents={parseFloat(price.price) * 100}></Money></>
        color = 'primary'
        break
      case 'MONTHLY':
        text = <><Trans>Montlhly fee</Trans> <Money currency={currency} cents={parseFloat(price.price) * 100}></Money></>
        color = 'primary'
        break
      default:
        text = <Trans>Price not known.</Trans>
        color = 'error'
    }
  }
  return (
    <Typography className="PluginPrice" color={color} variant="h6">{text}</Typography>
  )
}

PluginPrice.propTypes = {
  price: PropTypes.object,
  currency: PropTypes.string
}

export default PluginPrice
