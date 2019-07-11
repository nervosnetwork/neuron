import React, { useState, useCallback, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, TextField, TooltipHost, Modal } from 'office-ui-fabric-react'
import styled from 'styled-components'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import QRCode from 'widgets/QRCode'
import { Copy } from 'grommet-icons'

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
  wallet: { addresses = [] },
  match: { params },
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps<{ address: string }>>) => {
  const [t] = useTranslation()
  const [showLargeQRCode, setShowLargeQRCode] = useState(false)

  const accountAddress = useMemo(
    () =>
      params.address || (addresses.find(addr => addr.type === 0 && addr.txCount > 0) || { address: '' }).address || '',
    [params, addresses]
  )

  const copyAddress = useCallback(() => {
    window.clipboard.writeText(accountAddress)
  }, [accountAddress])

  if (!accountAddress) {
    return <div>{t('receive.address-not-found')}</div>
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
            placeholder={accountAddress}
            onClick={copyAddress}
            description={t('receive.prompt')}
          />
          <Copy onClick={copyAddress} />
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

Receive.displayName = 'Receive'

export default Receive
