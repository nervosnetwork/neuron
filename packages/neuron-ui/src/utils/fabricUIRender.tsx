import React from 'react'
import { DetailsRow, IDetailsRowProps } from 'office-ui-fabric-react'

export const onRenderRow = (rowProps?: IDetailsRowProps) => {
  return rowProps ? (
    <DetailsRow
      {...rowProps}
      styles={{
        root: {
          animationDuration: '0!important',
        },
      }}
    />
  ) : null
}

export default {
  onRenderRow,
}
