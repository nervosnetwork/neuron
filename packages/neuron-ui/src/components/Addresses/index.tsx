import React, { useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TextField, IconButton, getTheme } from 'office-ui-fabric-react'

import { openExternal, openContextMenu } from 'services/remote'
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
    },
    [t, isMainnet, history]
  )

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
          return (
            <tr key={addr.address} onContextMenu={() => onContextMenu(addr)}>
              <td className={styles.type} data-type={addr.type === 0 ? 'receiving' : 'change'} title={typeLabel}>
                {typeLabel}
              </td>
              <td className={`${styles.address} monospacedFont`}>
                <div data-address={addr.address}>
                  <span className="textOverflow">{addr.address.slice(0, -6)}</span>
                  <span>{addr.address.slice(-6)}</span>
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
}

Addresses.displayName = 'Addresses'

export default Addresses
