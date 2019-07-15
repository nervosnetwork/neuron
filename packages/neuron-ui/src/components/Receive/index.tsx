import React, { useState, useCallback, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Text, TextField, TooltipHost, Modal } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import QRCode from 'widgets/QRCode'
import { Copy } from 'grommet-icons'

const Receive = ({
  wallet: { addresses = [] },
  match: { params },
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps<{ address: string }>>) => {
  const [t] = useTranslation()
  const [showLargeQRCode, setShowLargeQRCode] = useState(false)

  const accountAddress = useMemo(
    () =>
      params.address ||
      (addresses.find(addr => addr.type === 0 && addr.txCount === 0) || { address: '' }).address ||
      '',
    [params, addresses]
  )

  const copyAddress = useCallback(() => {
    window.clipboard.writeText(accountAddress)
  }, [accountAddress])

  if (!accountAddress) {
    return <div>{t('receive.address-not-found')}</div>
  }

  return (
    <Stack tokens={{ childrenGap: 15 }} horizontalAlign="center">
      <Stack style={{ alignSelf: 'center' }}>
        <QRCode value={accountAddress} onQRCodeClick={() => setShowLargeQRCode(true)} size={256} exportable />
      </Stack>
      <Stack styles={{ root: { maxWidth: 500 } }}>
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
      </Stack>
      <Modal isOpen={showLargeQRCode} onDismiss={() => setShowLargeQRCode(false)}>
        <Stack
          styles={{
            root: {
              background: '#eee',
            },
          }}
        >
          <Text
            variant="large"
            as="h1"
            style={{
              padding: '0 15px',
            }}
          >
            {t('receive.address-qrcode')}
          </Text>
        </Stack>
        <Stack padding="15px">
          <QRCode value={accountAddress} size={400} />
        </Stack>
      </Modal>
    </Stack>
  )
}

Receive.displayName = 'Receive'

export default Receive
