import React from 'react'
import styled from 'styled-components'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import QRCode from 'qrcode.react'
import { useTranslation } from 'react-i18next'

declare global {
  interface Window {
    clipboard: any
  }
}

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
  const [t] = useTranslation()
  const address: string = '0x0da2fe99fe549e082d4ed483c2e968a89ea8d11aabf5d79e5cbf06522de6e674'
  return (
    <ReceivePanel>
      <h1>{t('Receive')}</h1>
      <QRCodePanel>
        <QRCode value={address} />
      </QRCodePanel>
      <OverlayTrigger placement="bottom" overlay={<Tooltip id="address-tooltip">{t('Click to copy')}</Tooltip>}>
        <Address onClick={() => window.clipboard.writeText(address)}>{address}</Address>
      </OverlayTrigger>
    </ReceivePanel>
  )
}

export default Receive
