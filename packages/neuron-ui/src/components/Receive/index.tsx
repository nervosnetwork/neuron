import React from 'react'
import styled from 'styled-components'
import { OverlayTrigger, Tooltip, Container, Card } from 'react-bootstrap'
import QRCode from 'qrcode.react'

declare global {
  interface Window {
    clipboard: any
  }
}

const QRCodePanel = styled.div`
  margin-top: 30px;
  text-align: center;
`

const Address = styled.div`
  color: black;
  margin-top: 50px;
  text-align: center;
`

const Receive = () => {
  const address: string = '0x0da2fe99fe549e082d4ed483c2e968a89ea8d11aabf5d79e5cbf06522de6e674'
  return (
    <Container>
      <Card>
        <Card.Header>
          <h2>Receive</h2>
        </Card.Header>
        <Card.Body>
          <QRCodePanel>
            <QRCode value={address} size={256} />
          </QRCodePanel>
          <OverlayTrigger placement="bottom" overlay={<Tooltip id="address-tooltip">Click to copy</Tooltip>}>
            <Address onClick={() => window.clipboard.writeText(address)}>{address}</Address>
          </OverlayTrigger>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default Receive
