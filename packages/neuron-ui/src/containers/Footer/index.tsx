import React, { useContext } from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import { Stack, getTheme, Text } from 'office-ui-fabric-react'
import { Alert as AlertIcon, Nodes as ConnectIcon } from 'grommet-icons'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { ConnectStatus, FULL_SCREENS } from 'utils/const'
import { NeuronWalletContext } from 'states/stateProvider'

const theme = getTheme()

// TODO: Listen to sync progress report and update
const SyncStatus = () => (
  <div style={{ display: 'flex', alignItems: 'center', fontSize: theme.fonts.small.fontSize }}>
    Synchronizing
    <progress value="80" max="100" style={{ marginLeft: '5px' }} />
  </div>
)

// TODO: Handle click event and go to Preferences - Networks
const NetworkStatus = ({ name, online }: { name: string; online: boolean }) => {
  return (
    <>
      {online ? <ConnectIcon size="small" color="green" /> : <AlertIcon size="small" color="red" />}
      <Text styles={{ root: [theme.fonts.small, { marginLeft: '5px' }] }}>{name}</Text>
    </>
  )
}

// Status bar
const Footer = ({ location: { pathname } }: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const {
    chain: { networkID, connectStatus },
    settings: { networks },
  } = useContext(NeuronWalletContext)

  if (FULL_SCREENS.find(url => pathname.startsWith(url))) {
    return null
  }
  const currentNetwork = networks.find(network => network.id === networkID)
  const stackStyles = {
    root: [
      {
        width: '100%',
        background: theme.palette.neutralLighter,
      },
    ],
  }
  const stackItemStyles = {
    root: [theme.fonts.small],
  }

  return (
    <Stack
      horizontal
      horizontalAlign="space-between"
      verticalFill
      verticalAlign="center"
      padding="0 15px"
      styles={stackStyles}
    >
      <Stack.Item styles={stackItemStyles}>
        <SyncStatus />
      </Stack.Item>

      <Stack.Item styles={stackItemStyles}>
        {currentNetwork ? (
          <NetworkStatus online={connectStatus === ConnectStatus.Online} name={currentNetwork.name} />
        ) : null}
      </Stack.Item>
    </Stack>
  )
}

Footer.displayName = 'Footer'

const Container: React.SFC = (props: any) =>
  createPortal(<Footer {...props} />, document.querySelector('footer') as HTMLElement)
export default Container
