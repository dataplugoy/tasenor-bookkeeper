import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import TagModel from '../Models/TagModel'
import { Avatar } from '@mui/material'
import withStore from '../Hooks/withStore'

@withStore
@observer
class Tags extends Component {

  render() {
    return (
      <div style={{ marginLeft: '2px', display: 'flex' }}>
        {this.props.tags.map((tag) => (
          <Avatar style={{ height: '22px', width: '22px' }} variant="rounded" key={tag.tag} src={tag.url}/>
        ))}
      </div>
    )
  }
}

Tags.propTypes = {
  store: PropTypes.instanceOf(Store),
  tags: PropTypes.arrayOf(PropTypes.instanceOf(TagModel))
}

export default Tags
