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

type AddressTransformWithCopyZoneProps = {
  showAddress: string
  isInShortFormat: boolean
  className?: string
  onClick: () => void
}

export const AddressTransformWithCopyZone = ({
  showAddress,
  isInShortFormat,
  onClick,
  className,
}: AddressTransformWithCopyZoneProps) => {
  const [t] = useTranslation()
  const transformLabel = t(
    isInShortFormat ? 'receive.turn-into-full-version-format' : 'receive.turn-into-deprecated-format'
  )

  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
  }, [])

  return (
    <div className={className}>
      <CopyZone content={showAddress} className={styles.showAddress}>
        {showAddress}
      </CopyZone>
      <button
        type="button"
        className={styles.addressToggle}
        onClick={onClick}
        title={transformLabel}
        onFocus={stopPropagation}
        onMouseOver={stopPropagation}
        onMouseUp={stopPropagation}
      >
        <AddressTransform />
        {transformLabel}
      </button>
    </div>
  )
}

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
        width: '60px',
        render(type) {
          return type === 0 ? t('addresses.receiving-address') : t('addresses.change-address')
        },
      },
      {
        title: t('addresses.address'),
        dataIndex: 'address',
        align: 'left',
        render(itemAddress: string) {
          return (
            <Tooltip
              tip={
                <CopyZone content={itemAddress} className={styles.copyTableAddress}>
                  {itemAddress}
                  <Copy />
                </CopyZone>
              }
              showTriangle
              isTriggerNextToChild
            >
              <div className={styles.address}>
                <span className={styles.overflow}>{itemAddress.slice(0, -6)}</span>
                <span>...</span>
                <span>{itemAddress.slice(-6)}</span>
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
        className: styles.txCount,
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
              tipClassName={styles.descTips}
            >
              <div className={styles.descText}>{description || t('addresses.default-description')}</div>
            </Tooltip>
          )
        },
      },
    ],
    [t, localDescription]
  )

  return (
    <div className={styles.multiAddressRoot}>
      <div className={styles.qrCodeContainer}>
        <Alert status="warn" className={styles.alert}>
          {t('receive.prompt')}
        </Alert>
        <div className={styles.qrCode} data-copy-success={showCopySuccess} data-copy-success-text={t('common.copied')}>
          <QRCode value={showAddress} size={128} includeMargin ref={ref} />
        </div>
        <div className={styles.copyAddress}>
          <AddressTransformWithCopyZone
            showAddress={showAddress}
            isInShortFormat={isInShortFormat}
            onClick={() => setIsInShortFormat(is => !is)}
          />
        </div>
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
