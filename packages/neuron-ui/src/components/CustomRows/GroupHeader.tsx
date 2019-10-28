import React from 'react'
import { Stack, Text, getTheme } from 'office-ui-fabric-react'

const {
  palette: { neutralLighterAlt, neutralSecondary, neutralLighter },
} = getTheme()

const GroupHeader = ({ group }: any) => {
  const { name } = group
  return (
    <Stack
      tokens={{ padding: 15 }}
      styles={{
        root: {
          background: neutralLighterAlt,
          borderTop: `1px solid ${neutralSecondary}`,
          borderBottom: `1px solid ${neutralLighter}`,
          padding: `15px 12px 5px`,
          minWidth: '100%!important',
        },
      }}
    >
      <Text variant="medium">{name}</Text>
    </Stack>
  )
}
export default GroupHeader
