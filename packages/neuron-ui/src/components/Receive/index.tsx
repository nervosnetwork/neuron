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
  const address: string = '0xcf078d66b3614C4c32B018ceF9100A39FaE7DC0D'
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
