import React from 'react'
import styled from 'styled-components'
import { Container, Card } from 'react-bootstrap'
import QRCode from 'qrcode.react'
import { useTranslation } from 'react-i18next'

declare global {
  interface Window {
    clipboard: any
  }
}

const AddressTip = styled.div`
  color: black;
  font-size: 18px;
  font-weight: bold;
  margin: 15px 0 0 30px;
`

const AddressPanel = styled.div`
  dispaly: flex;
  display: -webkit-flex; /* Safari */
  flex-direction: row;
  margin: 10px 0 0 30px;
`

const Address = styled.div`
  color: black;
  margin-right: 10px;
`

const CopyImage = styled.img`
  width: 15px;
  height: 20px;
  padding-top: 5px;
`

const QRCodePanel = styled.div`
  margin: 50px 0 0 30px;
`

const Receive = ({ address }: { address: string }) => {
  const [t] = useTranslation()
  const generateNewAddress = () => {
    // TODO: generate new address
    return '0x0da2fe99fe549e082d4ed483c2e968a89ea8d11aabf5d79e5cbf06522de6e674'
  }
  const accountAddress = address === undefined ? generateNewAddress() : address
  return (
    <Container>
      <Card>
        <Card.Header>
          <h2>{t('Receive')}</h2>
        </Card.Header>
        <Card.Body>
          <AddressTip>{t('Address')}</AddressTip>
          <AddressPanel>
            <Address onClick={() => window.clipboard.writeText(accountAddress)}>{accountAddress}</Address>
            <CopyImage
              src="./image/copy.png"
              alt="copy address"
              onClick={() => window.clipboard.writeText(accountAddress)}
              onKeyPress={() => window.clipboard.writeText(accountAddress)}
            />
          </AddressPanel>
          <QRCodePanel>
            <QRCode value={accountAddress} size={400} />
          </QRCodePanel>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default Receive
