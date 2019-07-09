import React, { useContext } from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { ConnectStatus, FULL_SCREENS } from 'utils/const'
import { NeuronWalletContext } from 'states/stateProvider'

const CurrentNetwork = styled.div<{ online: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  &:before {
    display: block;
    content: '';
    border-radius: 50%;
    width: 10px;
    height: 10px;
    color: ${props => (props.online ? 'green' : 'red')};
    background-color: currentColor;
    margin-right: 5px;
    filter: drop-shadow(0 0 0.5px currentColor);
  }
`

const Sync = () => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    Synchronizing
    <progress value="80" max="100" style={{ marginLeft: '5px' }} />
  </div>
)

const Footer = ({ location: { pathname } }: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const {
    chain: { networkID, connectStatus },
    settings: { networks },
  } = useContext(NeuronWalletContext)

  if (FULL_SCREENS.find(url => pathname.startsWith(url))) {
    return null
  }
  const currentNetwork = networks.find(network => network.id === networkID)

  return (
    <>
      <Sync />
      {currentNetwork ? (
        <CurrentNetwork online={connectStatus === ConnectStatus.Online}>{currentNetwork.name}</CurrentNetwork>
      ) : null}
    </>
  )
}

Footer.displayName = 'Footer'

const Container: React.SFC = (props: any) =>
  createPortal(<Footer {...props} />, document.querySelector('footer') as HTMLElement)
export default Container
