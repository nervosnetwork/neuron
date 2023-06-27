import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Button from 'widgets/Button'
import CopyZone from 'widgets/CopyZone'
import QRCode from 'widgets/QRCode'
import { AddressTransform, Copy } from 'widgets/Icons/icon'
import { ReactComponent as Edit } from 'widgets/Icons/Edit.svg'
import Alert from 'widgets/Alert'
import Table, { TableProps } from 'widgets/Table'
import { shannonToCKBFormatter, useLocalDescription } from 'utils'
import { HIDE_BALANCE } from 'utils/const'
import Tooltip from 'widgets/Tooltip'
import { useDispatch } from 'states'
import styles from './receive.module.scss'
import { useCopyAndDownloadQrCode, useSwitchAddress } from './hooks'

const MultiAddressReceive = ({
  address,
  addresses,
  walletId,
}: {
  address: string
  addresses: State.Address[]
  walletId: string
}) => {
  const [t] = useTranslation()
  const dispatch = useDispatch()
  const { isInShortFormat, setIsInShortFormat, address: showAddress } = useSwitchAddress(address)
  const { ref, showCopySuccess, onCopyQrCode, onDownloadQrCode } = useCopyAndDownloadQrCode()
  const { localDescription, onDescriptionPress, onDescriptionChange, onDescriptionFieldBlur, onDescriptionSelected } =
    useLocalDescription('address', walletId, dispatch, 'textarea')

  const columns = useMemo<TableProps<State.Address>['columns']>(
    () => [
      {
        title: t('addresses.type'),
        dataIndex: 'type',
        align: 'left',
        className: styles.addressType,
        render(type) {
          return type === 0 ? t('addresses.receiving-address') : t('addresses.change-address')
        },
      },
      {
        title: t('addresses.address'),
        dataIndex: 'address',
        align: 'left',
        render(v: string) {
          return (
            <Tooltip
              tip={
                <CopyZone content={v} className={styles.copyTableAddress}>
                  {v}
                  <Copy />
                </CopyZone>
              }
              showTriangle
              isTriggerNextToChild
            >
              <div className={styles.address}>
                <span className={styles.overflow}>{address.slice(0, -6)}</span>
                <span>...</span>
                <span>{address.slice(-6)}</span>
              </div>
            </Tooltip>
          )
        },
      },
      {
        title: t('addresses.balance'),
        dataIndex: 'balance',
        align: 'left',
        isBalance: true,
        className: styles.balance,
        render(balance: string, _, __, showBalance: boolean) {
          if (!showBalance) {
            return `${HIDE_BALANCE} CKB`
          }
          return (
            <CopyZone content={shannonToCKBFormatter(balance, false, '')} className={styles.copyBalance}>
              <span className="textOverflow">{`${shannonToCKBFormatter(balance)} CKB`}</span>
            </CopyZone>
          )
        },
      },
      {
        title: t('addresses.transactions'),
        dataIndex: 'txCount',
        align: 'center',
      },
      {
        title: t('addresses.description'),
        dataIndex: 'description',
        align: 'center',
        render(description: string, _idx, item) {
          const isSelected = localDescription.key === item.address
          return (
            <Tooltip
              tip={
                <div className={styles.descTipRoot}>
                  <div className={styles.autoHeight}>
                    <textarea
                      className={styles.descInput}
                      data-is-selected={isSelected}
                      data-description-key={item.address}
                      value={isSelected ? localDescription.description : description}
                      onChange={onDescriptionChange}
                      onKeyDown={onDescriptionPress}
                      onBlur={onDescriptionFieldBlur}
                    />
                    <Edit
                      data-description-key={item.address}
                      data-description-value={item.description}
                      onClick={onDescriptionSelected}
                    />
                  </div>
                  <div className={styles.hidden}>
                    {isSelected ? localDescription.description : description}
                    <Edit />
                  </div>
                </div>
              }
              showTriangle
              isTriggerNextToChild
              className={styles.description}
            >
              <div className={styles.descText}>{description || t('addresses.default-description')}</div>
            </Tooltip>
          )
        },
      },
    ],
    [t, localDescription]
  )
  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
  }, [])
  return (
    <div className={styles.multiAddressRoot}>
      <div className={styles.qrCodeContainer}>
        <Alert status="warn" className={styles.alert}>
          {t('receive.prompt')}
        </Alert>
        <div className={styles.qrCode} data-copy-success={showCopySuccess} data-copy-success-text={t('common.copied')}>
          <QRCode value={showAddress} size={128} includeMargin ref={ref} />
        </div>
        <CopyZone content={showAddress} className={styles.copyAddress}>
          {showAddress}
          <button
            type="button"
            className={styles.addressToggle}
            onClick={() => setIsInShortFormat(is => !is)}
            title={t(isInShortFormat ? `receive.turn-into-full-version-fomrat` : `receive.turn-into-deprecated-format`)}
            onFocus={stopPropagation}
            onMouseOver={stopPropagation}
            onMouseUp={stopPropagation}
          >
            <AddressTransform />
          </button>
        </CopyZone>
        <div className={styles.actions}>
          <Button
            type="primary"
            className={styles.addressBook}
            label={t('receive.save-qr-code')}
            onClick={onDownloadQrCode}
          />
          <Button className={styles.addressBook} label={t('receive.copy-qr-code')} onClick={onCopyQrCode} />
        </div>
      </div>
      <Table
        head={t('receive.address-book')}
        columns={columns}
        dataSource={addresses}
        className={styles.addresses}
        isFixedTable
      />
    </div>
  )
}

MultiAddressReceive.displayName = 'MultiAddressReceive'

export default MultiAddressReceive
