import React, { FC, useMemo, useState } from 'react'
import Tabs, { VariantProps } from 'widgets/Tabs'
import { clsx, localNumberFormatter, shannonToCKBFormatter } from 'utils'
import { useTranslation } from 'react-i18next'
import { scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import { onEnter } from 'utils/inputDevice'
import { EyesClose, EyesOpen } from 'widgets/Icons/icon'
import { HIDE_BALANCE, MAINNET_TAG } from 'utils/const'
import ScriptTag from 'components/ScriptTag'
import LockInfoDialog from 'components/LockInfoDialog'
import { useState as useGlobalState } from 'states'
import styles from './cellsCard.module.scss'

const TabsVariantWithCellsCard: FC<VariantProps<{
  title: string
  cells: (State.DetailedInput | State.DetailedOutput)[]
}>> = ({ tabs, selectedTab, onTabChange }) => {
  const [t] = useTranslation()
  const {
    chain: { networkID },
    settings: { networks },
  } = useGlobalState()
  const network = networks.find(n => n.id === networkID)
  const isMainnet = network != null && network.chain === MAINNET_TAG

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
          const address = cell.lock != null ? scriptToAddress(cell.lock, isMainnet) : null
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
                    <span className={styles.address}>{`${address.slice(0, 20)}...${address.slice(-20)}`} </span>
                    <ScriptTag isMainnet={isMainnet} script={cell.lock} onClick={() => setShowingLockInfo(cell.lock)} />
                  </>
                )}
              </div>
              <div>{`${isPrivacyMode ? HIDE_BALANCE : capacity} CKB`}</div>
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
