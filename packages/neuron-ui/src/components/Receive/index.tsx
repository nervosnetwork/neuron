import React, { useState } from 'react'
import styled from 'styled-components'
import { Stack, TextField, TooltipHost, Modal } from 'office-ui-fabric-react'
import QRCode from 'widgets/QRCode'
import { RouteComponentProps } from 'react-router-dom'
import { Copy as CopyIcon } from 'grommet-icons'
import { useTranslation } from 'react-i18next'
import { StateWithDispatch } from 'states/stateProvider/reducer'

declare global {
  interface Window {
    clipboard: any
  }
}

const QRCodePanel = styled.div`
  width: 300px;
  margin: 50px 0 0 30px;
`

const QRCodeModal = styled.div`
  text-align: center;
`

const Receive = ({
  wallet: { addresses },
  match,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps<{ address: string }>>) => {
  const [t] = useTranslation()
  const [showLargeQRCode, setShowLargeQRCode] = useState(false)
  const { params } = match

  const accountAddress = params.address || (addresses.find(addr => addr.type === 0) || { address: '' }).address

  if (!accountAddress) {
    return <div>{t('receive.address-not-found')}</div>
  }

  const copyAddress = () => {
    window.clipboard.writeText(accountAddress)
  }

  return (
    <Stack>
      <QRCodePanel onClick={() => setShowLargeQRCode(true)} style={{ alignSelf: 'center' }}>
        <QRCode value={accountAddress} size={256} />
      </QRCodePanel>
      <TooltipHost content={t('receive.click-to-copy')} calloutProps={{ gapSpace: 0 }}>
        <Stack horizontal horizontalAlign="stretch" tokens={{ childrenGap: 15 }}>
          <TextField
            styles={{ root: { flex: 1 } }}
            readOnly
            type="text"
            placeholder={accountAddress}
            onClick={() => copyAddress()}
            description={t('receive.prompt')}
          />
          <CopyIcon onClick={() => copyAddress()} />
        </Stack>
      </TooltipHost>
      <Modal isOpen={showLargeQRCode} onDismiss={() => setShowLargeQRCode(false)}>
        <div>{t('receive.address-qrcode')}</div>
        <div>
          <QRCodeModal>
            <QRCode value={accountAddress} size={400} />
          </QRCodeModal>
        </div>
      </Modal>
    </Stack>
  )
}

export default Receive
