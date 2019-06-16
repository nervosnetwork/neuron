import React from 'react'
import { createPortal } from 'react-dom'
import { useNeuronWallet } from 'utils/hooks'

const Sync = () => (
  <div>
    Synchronizing
    <progress value="80" max="100" />
  </div>
)
const Network = ({ name }: { name: string }) => <div>{name}</div>

const Footer = () => {
  const {
    chain: { networkId },
    settings: { networks },
  } = useNeuronWallet()
  const activeNetwork = networks.find(network => network.id === networkId)

  return (
    <>
      <Sync />
      {activeNetwork ? <Network name={activeNetwork.name} /> : null}
    </>
  )
}

Footer.displayName = 'Footer'

const Container: React.SFC = () => createPortal(<Footer />, document.querySelector('footer') as HTMLElement)
export default Container
