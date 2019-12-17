import React, { useState, useMemo, useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, TextField, DefaultButton, IconButton, Text, getTheme } from 'office-ui-fabric-react'

import { openExternal, openContextMenu } from 'services/remote'
import { ckbCore } from 'services/chain'
import { StateWithDispatch } from 'states/stateProvider/reducer'

import { useLocalDescription } from 'utils/hooks'
import { localNumberFormatter, shannonToCKBFormatter } from 'utils/formatters'
import { Routes, MAINNET_TAG } from 'utils/const'
import getExplorerUrl from 'utils/getExplorerUrl'
import * as styles from './addresses.module.scss'

const Addresses = ({
  wallet: { addresses = [], id: walletID },
  chain: { networkID },
  settings: { networks = [] },
  history,
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const isMainnet = (networks.find(n => n.id === networkID) || {}).chain === MAINNET_TAG
  const [showMainnetAddress, setShowMainnetAddress] = useState(false)
  const [t] = useTranslation()

  const {
    localDescription,
    onDescriptionPress,
    onDescriptionFieldBlur,
    onDescriptionChange,
    onDescriptionSelected,
  } = useLocalDescription('address', walletID, dispatch)

  const theme = getTheme()
  const { semanticColors } = theme

  const onContextMenu = useCallback(
    item => {
      if (item && item.address) {
        if (showMainnetAddress) {
          const menuTemplate = [
            {
              label: t('addresses.copy-address'),
              click: () => {
                window.clipboard.writeText(item.address)
              },
            },
          ]
          openContextMenu(menuTemplate)
        } else {
          const menuTemplate = [
            {
              label: t('addresses.copy-address'),
              click: () => {
                window.clipboard.writeText(item.address)
              },
            },
            {
              label: t('addresses.request-payment'),
              click: () => {
                history.push(`${Routes.Receive}/${item.address}`)
              },
            },
            {
              label: t('addresses.view-on-explorer'),
              click: () => {
                const explorerUrl = getExplorerUrl(isMainnet)
                openExternal(`${explorerUrl}/address/${item.address}`)
              },
            },
          ]
          openContextMenu(menuTemplate)
        }
      }
    },
    [t, showMainnetAddress, isMainnet, history]
  )

  const CustomList = useMemo(() => {
    return (
      <table className={styles.addressList}>
        <thead>
          <tr>
            {['type', 'address', 'description', 'balance', 'transactions'].map(field => (
              <th key={field}>{t(`addresses.${field}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {addresses.map(addr => {
            const isSelected = localDescription.key === addr.address
            const typeLabel = addr.type === 0 ? t('addresses.receiving-address') : t('addresses.change-address')
            const addressLabel = showMainnetAddress
              ? ckbCore.utils.bech32Address(addr.identifier, {
                  prefix: ckbCore.utils.AddressPrefix.Mainnet,
                  type: ckbCore.utils.AddressType.HashIdx,
                  codeHashOrCodeHashIndex: '0x00',
                }) || ''
              : addr.address
            return (
              <tr key={addr.address} onContextMenu={() => onContextMenu(addr)}>
                <td className={styles.type} data-type={addr.type === 0 ? 'receiving' : 'change'} title={typeLabel}>
                  {typeLabel}
                </td>
                <td className={`${styles.address} monospacedFont`}>
                  <div data-address={addressLabel}>
                    <span className="textOverflow">{addressLabel.slice(0, -6)}</span>
                    <span>{addressLabel.slice(-6)}</span>
                  </div>
                </td>
                <td className={styles.description} title={addr.description}>
                  <>
                    <TextField
                      data-description-key={addr.address}
                      data-description-value={addr.description}
                      borderless
                      title={addr.description}
                      value={isSelected ? localDescription.description : addr.description || ''}
                      onBlur={isSelected ? onDescriptionFieldBlur : undefined}
                      onKeyPress={isSelected ? onDescriptionPress : undefined}
                      onChange={isSelected ? onDescriptionChange : undefined}
                      readOnly={!isSelected}
                      styles={{
                        root: {
                          flex: 1,
                        },
                        fieldGroup: {
                          backgroundColor: isSelected ? '#fff' : 'transparent',
                          borderColor: 'transparent',
                          border: isSelected ? `1px solid ${semanticColors.inputBorder}!important` : 'none',
                        },
                      }}
                    />
                    {isSelected ? null : (
                      <IconButton
                        iconProps={{ iconName: 'Edit' }}
                        className="editButton"
                        onClick={onDescriptionSelected(addr.address, addr.description)}
                      />
                    )}
                  </>
                </td>
                <td className={styles.balance} title={`${shannonToCKBFormatter(addr.balance)} CKB`}>
                  {`${shannonToCKBFormatter(addr.balance)} CKB`}
                </td>
                <td className={styles.txCount} title={localNumberFormatter(addr.txCount)}>
                  {localNumberFormatter(addr.txCount)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }, [
    addresses,
    localDescription.key,
    localDescription.description,
    onDescriptionChange,
    onDescriptionFieldBlur,
    onDescriptionPress,
    onDescriptionSelected,
    semanticColors.inputBorder,
    showMainnetAddress,
    onContextMenu,
    t,
  ])

  return (
    <>
      <Stack verticalAlign="center" horizontalAlign="start" tokens={{ childrenGap: 15 }}>
        {!isMainnet ? (
          <DefaultButton
            text={t(`addresses.display-${showMainnetAddress ? 'testnet' : 'mainnet'}-addresses`)}
            onClick={() => setShowMainnetAddress(!showMainnetAddress)}
          />
        ) : null}
        {showMainnetAddress && !isMainnet ? (
          <Text variant="medium" style={{ color: semanticColors.errorText }}>
            {t('addresses.mainnet-address-caution')}
          </Text>
        ) : null}
      </Stack>
      {CustomList}
    </>
  )
}

Addresses.displayName = 'Addresses'

export default Addresses
