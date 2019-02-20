import React from 'react'
import styled from 'styled-components'
import QRCode from 'qrcode.react'

const ReceivePanel = styled.div`
  display: flex;
  flex-direction: column;
  width: 600px;
`
const QRCodePanel = styled.div`
  width: 300px;
  margin: 20px 0 30px 150px;
`

const Address = styled.div`
  color: black;
`

const Receive = () => {
  const address: string = '0x0da2fe99fe549e082d4ed483c2e968a89ea8d11aabf5d79e5cbf06522de6e674'
  return (
    <ReceivePanel>
      <h1>Receive</h1>
      <QRCodePanel>
        <QRCode value={address} />
      </QRCodePanel>
      <Address>{address}</Address>
    </ReceivePanel>
  )
}

export default Receive
