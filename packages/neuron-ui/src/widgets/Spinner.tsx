import React from 'react'
import { Spinner, SpinnerSize } from 'office-ui-fabric-react'

export default (props: any = {}) => {
  const { styles = {}, ...rest } = props
  const localStyles = {
    circle: {
      borderColor: '#3cc68a #c4f3df #c4f3df #c4f3df',
    },
    label: {
      color: '#3cc68a',
    },
    ...styles,
  }
  return <Spinner size={SpinnerSize.xSmall} styles={localStyles} {...rest} />
}
