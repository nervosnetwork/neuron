import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SyncStatus as SyncStatusEnum, ConnectionStatus, clsx, localNumberFormatter, getSyncLeftTime } from 'utils'
import { Confirming, NewTab, Question } from 'widgets/Icons/icon'
import { ReactComponent as UnexpandStatus } from 'widgets/Icons/UnexpandStatus.svg'
import { ReactComponent as StartBlock } from 'widgets/Icons/StartBlock.svg'
import Tooltip from 'widgets/Tooltip'
import { openExternal } from 'services/remote'
import styles from './syncStatus.module.scss'

const SyncDetail = ({
  syncBlockNumbers,
  isLookingValidTarget,
  onOpenValidTarget,
  isLightClient,
  onOpenSetStartBlock,
  startBlockNumber,
  estimate,
}: {
  syncBlockNumbers: string
  isLookingValidTarget: boolean
  onOpenValidTarget: (e: React.SyntheticEvent) => void
  isLightClient: boolean
  onOpenSetStartBlock: () => void
  startBlockNumber?: string
  estimate?: number
}) => {
  const [t] = useTranslation()
  return (
    <>
      <div className={styles.blockSynced}>
        {t('network-status.tooltip.block-synced')}:
        <br />
        <span className={styles.blockNumber}>{syncBlockNumbers}</span>
      </div>
      {isLookingValidTarget && (
        <div
          role="link"
          className={styles.action}
          onClick={onOpenValidTarget}
          onKeyPress={onOpenValidTarget}
          tabIndex={-1}
        >
          <div>
            <span>{t('network-status.tooltip.looking-valid-target')}</span>
            <NewTab />
          </div>
        </div>
      )}
      {isLightClient && startBlockNumber ? (
        <div className={styles.item}>
          <div className={styles.title}>{t('network-status.tooltip.start-block-number')}:</div>
          <div className={styles.number}>{localNumberFormatter(startBlockNumber)}</div>
        </div>
      ) : null}
      <div className={styles.item}>
        <div className={styles.title}>
          {t('network-status.left-time')}:
          <Tooltip
            tip={<div className={styles.leftTimeTip}>{t('network-status.left-time-tip')}</div>}
            className={styles.question}
            tipClassName={styles.questionTip}
            placement="right-bottom"
          >
            <Question />
          </Tooltip>
        </div>
        <div className={styles.number}>{getSyncLeftTime(estimate)}</div>
      </div>
      {isLightClient && (
        <div
          role="link"
          className={clsx(styles.action, styles.setStartBlockNumber)}
          onClick={onOpenSetStartBlock}
          onKeyPress={onOpenSetStartBlock}
          tabIndex={-1}
        >
          <div>
            <span>{t('network-status.tooltip.set-start-block-number')}</span>
            <StartBlock />
          </div>
        </div>
      )}
    </>
  )
}

const SyncStatus = ({
  syncStatus,
  connectionStatus,
  syncPercents,
  syncBlockNumbers,
  isLookingValidTarget,
  onOpenValidTarget,
  isMigrate,
  isLightClient,
  onOpenSetStartBlock,
  startBlockNumber,
  estimate,
}: React.PropsWithoutRef<{
  syncStatus: SyncStatusEnum
  connectionStatus: State.ConnectionStatus
  syncPercents: string
  syncBlockNumbers: string
  isLookingValidTarget: boolean
  onOpenValidTarget: (e: React.SyntheticEvent) => void
  isMigrate: boolean
  isLightClient: boolean
  onOpenSetStartBlock: () => void
  startBlockNumber?: string
  estimate?: number
}>) => {
  const [t] = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const onVisibleChange = useCallback((v: boolean) => {
    setIsOpen(v)
  }, [])

  if (isMigrate) {
    return <span>{t('network-status.migrating')}</span>
  }

  if (ConnectionStatus.Connecting === connectionStatus) {
    return <span>{t('navbar.connecting')}</span>
  }

  if (ConnectionStatus.Pause === connectionStatus) {
    return <span>{t('navbar.pause')}</span>
  }

  if (ConnectionStatus.Offline === connectionStatus) {
    return (
      <span className={styles.redDot}>
        {t('sync.sync-failed')}
        <Tooltip
          tip={
            <div className={styles.failedDetail}>
              {t('sync.sync-failed-detail')}
              &nbsp;&nbsp;
              <button
                type="button"
                onClick={() => {
                  openExternal(`https://neuron.magickbase.com/posts/issues/2893`)
                }}
                className={styles.openHelper}
              >
                {t('sync.learn-more')}
              </button>
            </div>
          }
          trigger="click"
          placement="left-bottom"
          showTriangle
          tipClassName={styles.helpTip}
        >
          <Question />
        </Tooltip>
      </span>
    )
  }

  if (SyncStatusEnum.SyncNotStart === syncStatus) {
    return <span className={styles.redDot}>{t('navbar.sync-not-start')}</span>
  }

  if (SyncStatusEnum.SyncPending === syncStatus) {
    return <span style={{ color: '#f7ae4d' }}>{t('sync.slow')}</span>
  }

  return (
    <Tooltip
      tip={
        <SyncDetail
          syncBlockNumbers={syncBlockNumbers}
          isLookingValidTarget={isLookingValidTarget}
          onOpenValidTarget={onOpenValidTarget}
          isLightClient={isLightClient}
          onOpenSetStartBlock={onOpenSetStartBlock}
          startBlockNumber={startBlockNumber}
          estimate={estimate}
        />
      }
      trigger="click"
      className={styles.tipContainer}
      tipClassName={styles.tip}
      onVisibleChange={onVisibleChange}
      showTriangle
    >
      {SyncStatusEnum.SyncCompleted === syncStatus ? (
        <button className={styles.synced} type="button">
          {t('sync.synced')}
          <UnexpandStatus className={styles.expand} data-is-open={isOpen} />
        </button>
      ) : (
        <button className={styles.syncing} type="button">
          <Confirming className={styles.confirm} />
          {t('sync.syncing', { syncPercents })}
          <UnexpandStatus className={styles.expand} data-is-open={isOpen} />
        </button>
      )}
    </Tooltip>
  )
}

SyncStatus.displayName = 'SyncStatus'
export default SyncStatus
