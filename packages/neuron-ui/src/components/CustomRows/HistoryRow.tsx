import React from 'react'
import { DetailsRow, IDetailsRowProps } from 'office-ui-fabric-react'

const HistoryRow = (props?: IDetailsRowProps) => {
  return props ? (
    <DetailsRow
      {...props}
      styles={{
        root: {
          animationDuration: '0!important',
          minWidth: '100%!important',
        },
        cell: {
          paddingTop: 0,
          paddingBottom: 0,
        },
      }}
    />
  ) : null
}

export default HistoryRow
