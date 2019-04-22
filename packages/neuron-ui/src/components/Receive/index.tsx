import React, { useState } from 'react'
import styled from 'styled-components'
import { Container, Card, OverlayTrigger, Tooltip, Modal, Form } from 'react-bootstrap'
import QRCode from 'qrcode.react'
import { RouteComponentProps } from 'react-router-dom'
import { Copy } from 'grommet-icons'
import { useTranslation } from 'react-i18next'

declare global {
  interface Window {
    clipboard: any
  }
}

const AddressPanel = styled.div`
  dispaly: flex;
  display: -webkit-flex; /* Safari */
  flex-direction: row;
  margin: 10px 0 0 0;
`

const CopyImage = styled(Copy)`
  width: 15px;
  height: 25px;
  padding-top: 10px;
  margin-left: 10px;
`

const QRCodePanel = styled.div`
  width: 300px;
  margin: 50px 0 0 30px;
`

const QRCodeModal = styled.div`
  text-align: center;
`

const Receive = (props: React.PropsWithoutRef<RouteComponentProps<{ address: string }>>) => {
  const [t] = useTranslation()
  const [showLargeQRCode, setShowLargeQRCode] = useState(false)
  const { match } = props
  const { params } = match
  const generateNewAddress = () => {
    // TODO: generate new address
    return '0x0da2fe99fe549e082d4ed483c2e968a89ea8d11aabf5d79e5cbf06522de6e674'
  }

  const accountAddress = !params.address || !params.address.startsWith('0x') ? generateNewAddress() : params.address
  const copyAddress = () => {
    window.clipboard.writeText(accountAddress)
  }

  return (
    <Container>
      <Card>
        <Card.Header>
          <h2>{t('siderbar.receive')}</h2>
        </Card.Header>
        <Card.Body>
          <Form.Group>
            <Form.Label>{t('Address')}</Form.Label>
            <AddressPanel>
              <OverlayTrigger placement="bottom" overlay={<Tooltip id="address-tooltip">{t('Copy address')}</Tooltip>}>
                <Form.Control readOnly type="text" placeholder={accountAddress} onClick={() => copyAddress()} />
              </OverlayTrigger>
              <OverlayTrigger placement="bottom" overlay={<Tooltip id="address-tooltip">{t('Copy address')}</Tooltip>}>
                <CopyImage onClick={() => copyAddress()} />
              </OverlayTrigger>
            </AddressPanel>
          </Form.Group>
          <QRCodePanel onClick={() => setShowLargeQRCode(true)}>
            <QRCode value={accountAddress} size={256} />
          </QRCodePanel>

          <Modal centered show={showLargeQRCode} onHide={() => setShowLargeQRCode(false)}>
            <Modal.Header closeButton>
              <Modal.Title id="contained-modal-title-vcenter">{t('Address QRCode')}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <QRCodeModal>
                <QRCode value={accountAddress} size={400} />
              </QRCodeModal>
            </Modal.Body>
          </Modal>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default Receive
