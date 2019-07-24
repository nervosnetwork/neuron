import React, { useState, useCallback, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Text, TextField, TooltipHost, Modal, FontSizes } from 'office-ui-fabric-react'

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
    window.navigator.clipboard.writeText(accountAddress)
  }, [accountAddress])

  if (!accountAddress) {
    return <div>{t('receive.address-not-found')}</div>
  }

  return (
    <>
      <Stack horizontal tokens={{ childrenGap: 40 }} padding="20px 0 0 0" horizontalAlign="space-between">
        <Stack styles={{ root: { flex: 1 } }}>
          <TooltipHost content={t('receive.click-to-copy')} calloutProps={{ gapSpace: 0 }}>
            <Stack horizontal horizontalAlign="stretch" tokens={{ childrenGap: 15 }}>
              <TextField
                styles={{
                  root: {
                    flex: 1,
                  },
                  description: {
                    fontSize: FontSizes.medium,
                  },
                }}
                readOnly
                placeholder={accountAddress}
                onClick={copyAddress}
                description={t('receive.prompt')}
              />
              <Copy onClick={copyAddress} />
            </Stack>
          </TooltipHost>
        </Stack>

        <Stack style={{ alignSelf: 'center' }}>
          <QRCode value={accountAddress} onQRCodeClick={() => setShowLargeQRCode(true)} size={256} exportable />
        </Stack>
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
        <Stack tokens={{ padding: '15px' }}>
          <QRCode value={accountAddress} size={400} />
        </Stack>
      </Modal>
    </>
  )
}

Receive.displayName = 'Receive'

export default Receive
