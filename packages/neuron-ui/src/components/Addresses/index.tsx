import React, { useEffect, useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Edit } from 'grommet-icons'
import TextField from 'widgets/TextField'

import { openExternal, openContextMenu } from 'services/remote'
import { StateWithDispatch } from 'states/stateProvider/reducer'

import { useLocalDescription } from 'utils/hooks'
import { localNumberFormatter, shannonToCKBFormatter } from 'utils/formatters'
import { Routes, MAINNET_TAG } from 'utils/const'
import { backToTop } from 'utils/animations'
import getExplorerUrl from 'utils/getExplorerUrl'
import styles from './addresses.module.scss'

const Addresses = ({
  wallet: { addresses = [], id: walletID },
  chain: { networkID },
  settings: { networks = [] },
  history,
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const isMainnet = (networks.find(n => n.id === networkID) || {}).chain === MAINNET_TAG
  const [t] = useTranslation()

  useEffect(() => {
    backToTop()
  }, [])

  const {
    localDescription,
    onDescriptionPress,
    onDescriptionFieldBlur,
    onDescriptionChange,
    onDescriptionSelected,
  } = useLocalDescription('address', walletID, dispatch)

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
    <div className={styles.container}>
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
                    <span className={styles.addressOverflow}>{addr.address.slice(0, -6)}</span>
                    <span className={styles.ellipsis}>...</span>
                    <span>{addr.address.slice(-6)}</span>
                  </div>
                </td>
                <td title={addr.description} className={styles.description}>
                  <TextField
                    field="description"
                    data-description-key={addr.address}
                    data-description-value={addr.description}
                    title={addr.description}
                    value={isSelected ? localDescription.description : addr.description || ''}
                    onBlur={isSelected ? onDescriptionFieldBlur : undefined}
                    onKeyPress={isSelected ? onDescriptionPress : undefined}
                    onChange={isSelected ? onDescriptionChange : undefined}
                    readOnly={!isSelected}
                    onDoubleClick={onDescriptionSelected}
                    className={styles.descriptionField}
                    suffix={
                      isSelected ? (
                        undefined
                      ) : (
                        <button
                          type="button"
                          data-description-key={addr.address}
                          data-description-value={addr.description}
                          onClick={onDescriptionSelected}
                          className={styles.editBtn}
                        >
                          <Edit size="0.875rem" />
                        </button>
                      )
                    }
                  />
                </td>
                <td className={styles.balance} title={`${shannonToCKBFormatter(addr.balance)} CKB`}>
                  <span className="textOverflow">{`${shannonToCKBFormatter(addr.balance)} CKB`}</span>
                </td>
                <td className={styles.txCount} title={localNumberFormatter(addr.txCount)}>
                  {localNumberFormatter(addr.txCount)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

Addresses.displayName = 'Addresses'

export default Addresses
