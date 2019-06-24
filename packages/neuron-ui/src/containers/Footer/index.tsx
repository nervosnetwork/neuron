import React from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { ConnectStatus } from 'utils/const'
import { useNeuronWallet } from 'utils/hooks'

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
    margin-right: 15px;
    filter: drop-shadow(0 0 1px currentColor);
  }
`

const Sync = () => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    Synchronizing
    <progress value="80" max="100" />
  </div>
)

const Footer = () => {
  const {
    chain: { networkId, connectStatus },
    settings: { networks },
  } = useNeuronWallet()
  const activeNetwork = networks.find(network => network.id === networkId)

  return (
    <>
      <Sync />
      {activeNetwork ? (
        <CurrentNetwork online={connectStatus === ConnectStatus.Online}>{activeNetwork.name}</CurrentNetwork>
      ) : null}
    </>
  )
}

Footer.displayName = 'Footer'

const Container: React.SFC = () => createPortal(<Footer />, document.querySelector('footer') as HTMLElement)
export default Container
