import React, { useState } from 'react'
import styled from 'styled-components'
import { Form } from 'react-bootstrap'

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
      <Form>
        {networks.map(network => (
          <NetworkItem key={network}>
            <Form.Check
              inline
              label={network}
              type="radio"
              checked={network === networkSelected}
              onChange={() => {
                setNetworkSelected(network)
              }}
            />
          </NetworkItem>
        ))}
      </Form>
    </ContentPanel>
  )
}

export default Network
