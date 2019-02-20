import React from 'react'
import styled from 'styled-components'
import { Box, Tab, Tabs } from 'grommet'

const SettingsPanel = styled.div`
  width: 800px;
`

const Settings = () => {
  const network: string = 'Network'
  return (
    <SettingsPanel>
      <Tabs flex="grow" alignSelf="center">
        <Tab title="Tab 1">
          <Box margin="small" pad="small">
            <div>{network}</div>
          </Box>
        </Tab>
      </Tabs>
    </SettingsPanel>
  )
}

export default Settings
