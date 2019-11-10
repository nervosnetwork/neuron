import React, { useState, useCallback, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Text, TextField, TooltipHost, Modal, IconButton } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import QRCode from 'widgets/QRCode'
import { addPopup } from 'states/stateProvider/actionCreators'

const Receive = ({
  wallet: { addresses = [] },
  match: { params },
  dispatch,
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
    addPopup('addr-copied')(dispatch)
  }, [accountAddress, dispatch])

  const Address = useMemo(
    () => (
      <Stack styles={{ root: { flex: 1, minWidth: 500 } }}>
        <TooltipHost content={t('receive.click-to-copy')} calloutProps={{ gapSpace: 0 }}>
          <Stack horizontal horizontalAlign="stretch" tokens={{ childrenGap: 15 }}>
            <TextField
              styles={{
                root: {
                  flex: 1,
                  color: '#888',
                },
                fieldGroup: {
                  borderColor: '#eee!important',
                },
              }}
              readOnly
              placeholder={accountAddress}
              onClick={copyAddress}
            />
            <IconButton iconProps={{ iconName: 'Copy' }} onClick={copyAddress} />
          </Stack>
        </TooltipHost>
      </Stack>
    ),
    [copyAddress, accountAddress, t]
  )

  if (!accountAddress) {
    return <div>{t('receive.address-not-found')}</div>
  }

  return (
    <>
      <Stack tokens={{ childrenGap: 10 }} horizontalAlign="center">
        <Text as="p" variant="medium">
          {`${t('receive.address', { network: accountAddress.startsWith('ckb') ? 'CKB Mainnet' : 'CKB Testnet' })}`}
        </Text>
        <Stack style={{ alignSelf: 'center' }}>
          <QRCode
            value={accountAddress}
            onQRCodeClick={() => setShowLargeQRCode(true)}
            size={256}
            exportable
            includeMargin
            dispatch={dispatch}
            remark={Address}
          />
        </Stack>
        <Text as="p" variant="medium">
          {t('receive.prompt')}
        </Text>
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
          <QRCode value={accountAddress} size={400} dispatch={dispatch} />
        </Stack>
      </Modal>
    </>
  )
}

Receive.displayName = 'Receive'

export default Receive
