import React, { useState } from 'react'
import styled from 'styled-components'
import { RadioButton } from 'grommet'

const ContentPanel = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: left;
  margin: 30px;
`
const NetworkItem = styled.div`
  margin-top: 30px;
`

const Network = () => {
  const networks: string[] = ['Mainnet', 'Testnet']
  const [networkSelected, setNetworkSelected] = useState(networks[0])

  return (
    <ContentPanel>
      {networks.map(network => (
        <NetworkItem>
          <RadioButton
            name="network"
            checked={networkSelected === network}
            label={network}
            onChange={() => {
              setNetworkSelected(network)
            }}
          />
        </NetworkItem>
      ))}
    </ContentPanel>
  )
}

export default Network
