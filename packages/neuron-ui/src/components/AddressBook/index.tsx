import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState, useDispatch } from 'states'
import Dialog from 'widgets/Dialog'
import CopyZone from 'widgets/CopyZone'
import { Copy } from 'widgets/Icons/icon'
import { ReactComponent as Edit } from 'widgets/Icons/Edit.svg'
import Table, { TableProps } from 'widgets/Table'
import { shannonToCKBFormatter, useLocalDescription } from 'utils'
import { HIDE_BALANCE } from 'utils/const'
import Tooltip from 'widgets/Tooltip'
import styles from './addressBook.module.scss'

const AddressBook = ({ onClose }: { onClose?: () => void }) => {
  const { wallet } = useGlobalState()
  const [t] = useTranslation()
  const { addresses, id: walletId } = wallet

  const [tabIdx, setTabIdx] = useState('0')
  const onTabClick = (e: React.SyntheticEvent<HTMLDivElement, MouseEvent>) => {
    const {
      dataset: { idx },
    } = e.target as HTMLDivElement
    if (idx) {
      setTabIdx(idx)
    }
  }

  const tableData = useMemo(() => {
    if (tabIdx === '1') {
      return addresses.filter(item => item.type === 0)
    }
    if (tabIdx === '2') {
      return addresses.filter(item => item.type !== 0)
    }
    return addresses
  }, [tabIdx, addresses])

  const dispatch = useDispatch()
  const { localDescription, onDescriptionPress, onDescriptionChange, onDescriptionFieldBlur, onDescriptionSelected } =
    useLocalDescription('address', walletId, dispatch, 'textarea')

  const columns = useMemo<TableProps<State.Address>['columns']>(
    () => [
      {
        title: t('addresses.type'),
        dataIndex: 'type',
        align: 'left',
        width: '80px',
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
              tipClassName={styles.addressTip}
            >
              <div className={styles.address}>
                <span className={styles.overflow}>{itemAddress.slice(0, 6)}</span>
                <span>...</span>
                <span>{itemAddress.slice(-6)}</span>
              </div>
            </Tooltip>
          )
        },
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
        sorter: (a: State.Address, b: State.Address) => {
          return Number(a.balance) - Number(b.balance)
        },
      },
      {
        title: t('addresses.transactions'),
        dataIndex: 'txCount',
        align: 'center',
        className: styles.txCount,
        width: '100px',
        sorter: (a: State.Address, b: State.Address) => {
          return a.txCount - b.txCount
        },
      },
    ],
    [t, localDescription]
  )

  return (
    <Dialog show title={t('receive.address-book')} onCancel={onClose} showFooter={false}>
      <div className={styles.container}>
        <div className={styles.content}>
          <Table
            columns={columns}
            dataSource={tableData}
            className={styles.addressTable}
            isFixedTable
            hasHoverTrBg={false}
            head={
              <div role="presentation" className={styles.recordTab} data-idx={tabIdx} onClick={onTabClick}>
                <button type="button" role="tab" data-idx="0">
                  {t('addresses.all-address')}
                </button>
                <button type="button" role="tab" data-idx="1">
                  {t('addresses.receiving-address')}
                </button>
                <button type="button" role="tab" data-idx="2">
                  {t('addresses.change-address')}
                </button>
                <div className={styles.underline} />
              </div>
            }
          />
        </div>
      </div>
    </Dialog>
  )
}

AddressBook.displayName = 'AddressBook'

export default AddressBook
