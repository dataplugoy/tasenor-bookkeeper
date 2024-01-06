import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { Money, Localize } from '@tasenor/common-ui'
import './ReportLine.css'
import { TableRow, TableCell } from '@mui/material'
import { haveSettings } from '@tasenor/common'
import { sprintf } from 'sprintf-js'

@observer
class ReportLine extends Component {

  render() {

    const settings = haveSettings()

    let {
      id, name, number, values, bold, error, italic, hideTotal, tab, pageBreak,
      paragraphBreak, isAccount, fullWidth, needLocalization, useRemainingColumns, bigger
    } = this.props.line

    const columns = this.props.columns
    if (isAccount) {
      name = `${number} ${name}`
    }

    // Decorate text based on instructions.
    const decor = (text) => {
      if (bold) {
        text = <b>{text}</b>
      }
      if (italic) {
        text = <i>{text}</i>
      }
      if (error) {
        text = <span style={{ color: 'red' }}>{text}</span>
      }
      return text
    }

    // Construct table cell.
    const td = (column, content, extras = {}) => {
      const classNames = column.type + (extras.className ? ' ' + extras.className : '')

      return <TableCell
        key={column.name}
        colSpan={extras.colSpan !== undefined ? extras.colSpan : (fullWidth === undefined ? 1 : columns.length)}
        className={classNames}>{content}</TableCell>
    }

    // Rendering functions per type.
    const render = (column, extras = {}) => {
      switch (column.type) {
        // ID of the entry.
        case 'id':
          return td(column, decor(id), extras)
        case 'text':
          return td(column, values && !hideTotal && values[column.name] !== '' ? decor(values[column.name]) : '', extras)
        // Name of the entry.
        case 'name':
          return td(column, decor(needLocalization ? <Localize>{name}</Localize> : name), { ...extras, className: 'tab' + (tab || 0) })
        // Render currency value.
        case 'currency':
          return td(column,
            values && !hideTotal && values[column.name] !== ''
              ? (
                  decor(values[column.name] === null ? '–' : <Money currency={settings.get('currency')} cents={values[column.name]}></Money>)
                )
              : ''
          )
        // Render numeric value.
        case 'numeric':
          return td(column,
            values && !hideTotal && values[column.name] !== ''
              ? (
                  decor(values[column.name] === null ? '–' : sprintf('%f', decor(values[column.name])))
                )
              : ''
          )
        default:
          throw new Error(`Invalid column type '${column.type}'.`)
      }
      /*
      */
    }

    const classNames = 'ReportLine' + (pageBreak ? ' pageBreak' : '') + (bigger ? ' bigger' : '') + (paragraphBreak ? ' paragraphBreak' : '')

    if (fullWidth !== undefined) {
      return <TableRow className={classNames}>
        {render(columns[0])}
      </TableRow>
    }

    if (useRemainingColumns !== undefined) {
      const ret = []
      for (let i = 0; i <= useRemainingColumns; i++) {
        ret.push(render(columns[i], {
          colSpan: i === useRemainingColumns ? columns.length - useRemainingColumns : 1
        }))
      }
      return <TableRow className={classNames}>{ret}</TableRow>
    }

    return <TableRow className={classNames}>
      {columns.map((column) => render(column))}
    </TableRow>
  }
}

ReportLine.propTypes = {
  columns: PropTypes.array,
  line: PropTypes.object.isRequired,
}

export default ReportLine
