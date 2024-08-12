import React, { FC, useMemo, useState } from 'react'
import Tabs, { VariantProps } from 'widgets/Tabs'
import { type CKBComponents } from '@ckb-lumos/lumos/rpc'
import { clsx, localNumberFormatter, shannonToCKBFormatter, scriptToAddress, isMainnet as isMainnetUtils } from 'utils'
import { useTranslation } from 'react-i18next'
import { onEnter } from 'utils/inputDevice'
import { EyesClose, EyesOpen } from 'widgets/Icons/icon'
import { HIDE_BALANCE } from 'utils/const'
import ScriptTag from 'components/ScriptTag'
import LockInfoDialog from 'components/LockInfoDialog'
import { useState as useGlobalState } from 'states'
import CopyZone from 'widgets/CopyZone'
import Tooltip from 'widgets/Tooltip'
import styles from './cellsCard.module.scss'

const TabsVariantWithCellsCard = ({
  tabs,
  selectedTab,
  onTabChange,
}: VariantProps<{ title: string; cells: (State.DetailedInput | State.DetailedOutput)[] }>): React.ReactElement => {
  const [t] = useTranslation()
  const {
    chain: { networkID },
    settings: { networks },
  } = useGlobalState()
  const isMainnet = isMainnetUtils(networks, networkID)

  const [isPrivacyMode, setIsPrivacyMode] = useState(false)
  const [showingLockInfo, setShowingLockInfo] = useState<CKBComponents.Script | null>(null)

  return (
    <div className={styles.cells}>
      <LockInfoDialog lockInfo={showingLockInfo} isMainnet={isMainnet} onDismiss={() => setShowingLockInfo(null)} />
      <div className={styles.cellTypes} role="tablist">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={clsx(styles.cellType, { [styles.active]: selectedTab.id === tab.id })}
            role="tab"
            tabIndex={0}
            onKeyDown={onEnter(() => onTabChange(tab.id))}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.title}
          </div>
        ))}
      </div>
      <div className={styles.cellsPanel} role="tabpanel">
        <div className={clsx(styles.row, styles.columns)}>
          <div className={styles.column}>{t('nervos-dao-detail.index')}</div>
          <div className={styles.column}>{t('nervos-dao-detail.address')}</div>
          <div className={styles.column}>
            {t('nervos-dao-detail.amount')}
            {isPrivacyMode ? (
              <EyesClose className={styles.eyes} onClick={() => setIsPrivacyMode(false)} />
            ) : (
              <EyesOpen className={styles.eyes} onClick={() => setIsPrivacyMode(true)} />
            )}
          </div>
        </div>
        {selectedTab.cells.map((cell, index) => {
          const address = cell.lock != null ? scriptToAddress(cell.lock, { isMainnet }) : null
          const capacity = cell.capacity ? shannonToCKBFormatter(cell.capacity) : '--'

          return (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className={styles.row}>
              <div>{index}</div>
              <div>
                {!address ? (
                  t('transaction.cell-from-cellbase')
                ) : (
                  <>
                    <Tooltip
                      tip={
                        <CopyZone content={address} className={styles.copyTableAddress}>
                          {address}
                        </CopyZone>
                      }
                      className={styles.addressTips}
                      showTriangle
                      isTriggerNextToChild
                    >
                      <span className={styles.address}>{`${address.slice(0, 20)}...${address.slice(-20)}`} </span>
                    </Tooltip>
                    <ScriptTag
                      className={styles.scriptTag}
                      isMainnet={isMainnet}
                      script={cell.lock}
                      onClick={() => setShowingLockInfo(cell.lock)}
                    />
                  </>
                )}
              </div>
              <div>
                {isPrivacyMode ? (
                  `${HIDE_BALANCE} CKB`
                ) : (
                  <CopyZone content={capacity} className={styles.balance} maskRadius={8}>
                    {`${capacity} CKB`}
                  </CopyZone>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const CellsCard: FC<{ transaction: State.DetailedTransaction }> = ({ transaction }) => {
  const [t] = useTranslation()

  const tabs = useMemo(
    () => [
      {
        id: 'inputs',
        title: `${t('transaction.inputs')} (${transaction.inputs.length}/${localNumberFormatter(
          transaction.inputsCount
        )})`,
        cells: transaction.inputs,
      },
      {
        id: 'outputs',
        title: `${t('transaction.outputs')} (${transaction.outputs.length}/${localNumberFormatter(
          transaction.outputsCount
        )})`,
        cells: transaction.outputs,
      },
    ],
    [t, transaction]
  )

  return <Tabs Variant={TabsVariantWithCellsCard} tabs={tabs} />
}

export default CellsCard
