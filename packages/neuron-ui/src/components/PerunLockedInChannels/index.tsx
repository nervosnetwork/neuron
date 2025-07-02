import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState, useDispatch } from 'states'
import Dialog from 'widgets/Dialog'
import { CkbIcon, PartnerIcon } from 'widgets/Icons/icon'
import Table, { TableProps } from 'widgets/Table'
import Button from 'widgets/Button'
import { shannonToCKBFormatter, useLocalDescription } from 'utils'
import PerunCloseChannel from 'components/PerunCloseChannel'
import styles from './perunLockedInChannels.module.scss'

const PerunLockedInChannels = ({ onClose }: { onClose?: () => void }) => {
  const { wallet } = useGlobalState()
  const [t] = useTranslation()
  const { addresses, id: walletId } = wallet

  const [channel, setChannel] = useState('')

  const tableData = addresses

  const columns = useMemo<TableProps<State.Address>['columns']>(
    () => [
      {
        title: t('perun.token'),
        dataIndex: 'type',
        align: 'left',
        width: '80px',
        render(type) {
          return (
            <div className={styles.token}>
              <CkbIcon />
              CKB
            </div>
          )
        },
      },
      {
        title: t('perun.partner'),
        dataIndex: 'address',
        align: 'left',
        render(itemAddress: string) {
          return (
            <div className={styles.partner}>
              <PartnerIcon />
              ckb1qz...588pj7
            </div>
          )
        },
      },
      {
        title: t('perun.my-funds'),
        dataIndex: 'description',
        align: 'center',
        render(description: string, _idx, item) {
          return <p>34,00.01</p>
        },
      },
      {
        title: t('perun.operation'),
        dataIndex: 'balance',
        align: 'left',
        render(balance: string) {
          return (
            <Button type="cancel" className={styles.operation} onClick={() => setChannel(balance)}>
              {t('perun.close-channel')}
            </Button>
          )
        },
      },
    ],
    [t]
  )

  return (
    <div>
      <Dialog show title={t('perun.locked-in-channels')} onCancel={onClose} showFooter={false}>
        <div className={styles.container}>
          <div className={styles.content}>
            <Table
              columns={columns}
              dataSource={tableData}
              className={styles.addressTable}
              isFixedTable
              hasHoverTrBg={false}
            />
          </div>
        </div>
      </Dialog>

      {channel && <PerunCloseChannel onClose={() => setChannel('')} />}
    </div>
  )
}

PerunLockedInChannels.displayName = 'PerunLockedInChannels'

export default PerunLockedInChannels
