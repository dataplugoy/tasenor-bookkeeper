import React from 'react'

type PluginIconProps = {
  svg: string
}

const PluginIcon = (props: PluginIconProps): JSX.Element => {
  return <span style={{ transform: 'scale(1.5)' }} dangerouslySetInnerHTML={{ __html: props.svg }} />
}

export default PluginIcon
