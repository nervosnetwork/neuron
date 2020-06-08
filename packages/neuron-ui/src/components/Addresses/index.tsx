import React, { useEffect, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Edit } from 'grommet-icons'
import TextField from 'widgets/TextField'
import Breadcrum from 'widgets/Breadcrum'
import CopyZone from 'widgets/CopyZone'

import { useState as useGlobalState, useDispatch } from 'states'
import { openExternal, openContextMenu } from 'services/remote'

import {
  useLocalDescription,
  backToTop,
  RoutePath,
  localNumberFormatter,
  shannonToCKBFormatter,
  getExplorerUrl,
  isMainnet as isMainnetUtil,
} from 'utils'

import styles from './addresses.module.scss'

const Addresses = () => {
  const {
    wallet: { addresses = [], id: walletID },
    chain: { networkID },
    settings: { networks = [] },
  } = useGlobalState()
  const dispatch = useDispatch()
  const [t] = useTranslation()
  const history = useHistory()

  const isMainnet = isMainnetUtil(networks, networkID)
  const breakcrum = [{ label: t('navbar.receive'), link: RoutePath.Receive }]

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
    (item: State.Address) => (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
      e.stopPropagation()
      e.preventDefault()
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
              history.push(`${RoutePath.Receive}/${item.address}`)
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
    <div>
      <Breadcrum pages={breakcrum} />
      <div className={styles.title}>{t('addresses.title')}</div>
      <div className={styles.tableContainer}>
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
              const balance = `${shannonToCKBFormatter(addr.balance)} CKB`

              return (
                <tr key={addr.address} onContextMenu={onContextMenu(addr)}>
                  <td className={styles.type} data-type={addr.type === 0 ? 'receiving' : 'change'} title={typeLabel}>
                    {typeLabel}
                  </td>
                  <td className={styles.address}>
                    <div data-address={addr.address}>
                      <CopyZone content={addr.address} name={t('addresses.copy-address')}>
                        <span className={styles.addressOverflow}>{addr.address.slice(0, -6)}</span>
                        <span className={styles.ellipsis}>...</span>
                        <span>{addr.address.slice(-6)}</span>
                      </CopyZone>
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
                  <td className={styles.balance} title={balance}>
                    <CopyZone content={balance.slice(0, -4).replace(/,/g, '')}>
                      <span className="textOverflow">{balance}</span>
                    </CopyZone>
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
    </div>
  )
}

Addresses.displayName = 'Addresses'

export default Addresses
