import React, { FC, PropsWithChildren, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ErrorCode,
  getExplorerUrl,
  isMainnet as isMainnetUtil,
  localNumberFormatter,
  getNetworkLabelI18nkey,
  RoutePath,
} from 'utils'
import Alert from 'widgets/Alert'
import { Close } from 'widgets/Icons/icon'
import Sun from 'widgets/Icons/Sun.svg?react'
import Moon from 'widgets/Icons/Moon.svg?react'
import SyncStatusComponent from 'components/SyncStatus'
import { AppActions, useDispatch, useState as useGlobalState } from 'states'
import { openExternal } from 'services/remote'
import Tooltip from 'widgets/Tooltip'
import { NetworkType } from 'utils/const'
import SetStartBlockNumberDialog from 'components/SetStartBlockNumberDialog'

import { useMigrate, useSetBlockNumber, useTheme } from './hooks'
import styles from './pageContainer.module.scss'

const PageHeadNotice = ({ notice }: { notice: State.PageNotice }) => {
  const [t] = useTranslation()
  return (
    <Alert status={notice.status} className={styles.notice} key={`${notice.i18nKey}_${notice.index}`}>
      {t(notice.i18nKey)}
    </Alert>
  )
}

type ComponentProps = {
  head: React.ReactNode
  notice?: State.PageNotice
  className?: string
  isHomePage?: boolean
} & React.AllHTMLAttributes<HTMLDivElement>
const PageContainer: React.FC<ComponentProps> = props => {
  const {
    app: { showWaitForFullySynced },
    chain: {
      syncState: { bestKnownBlockNumber, cacheTipBlockNumber, syncStatus, isLookingValidTarget, validTarget, estimate },
      connectionStatus,
      networkID,
    },
    wallet: { addresses, id, startBlockNumber: walletStartBlockNumber },
    settings: { networks },
  } = useGlobalState()
  const { children, head, notice, className, isHomePage } = props
  const [t] = useTranslation()
  const dispatch = useDispatch()
  const closeSyncNotice = useCallback(() => {
    dispatch({
      type: AppActions.HideWaitForFullySynced,
    })
  }, [dispatch])
  const { theme, onSetTheme } = useTheme()
  const network = useMemo(() => networks.find(n => n.id === networkID), [networks, networkID])
  const isLightClient = useMemo(
    () => networks.find(n => n.id === networkID)?.type === NetworkType.Light,
    [networkID, networks]
  )
  const netWorkTypeLabel = useMemo(() => (network ? getNetworkLabelI18nkey(network.chain) : ''), [network])
  const [syncPercents, syncBlockNumbers] = useMemo(() => {
    const bestBlockNumber = Math.max(cacheTipBlockNumber, bestKnownBlockNumber)
    return [
      bestBlockNumber > 0 && cacheTipBlockNumber > 0
        ? `${+((cacheTipBlockNumber * 100) / bestBlockNumber).toFixed(2)}%`
        : '0.00%',
      `${cacheTipBlockNumber >= 0 ? localNumberFormatter(cacheTipBlockNumber) : '-'} / ${
        bestBlockNumber >= 0 ? localNumberFormatter(bestBlockNumber) : '-'
      }`,
    ]
  }, [cacheTipBlockNumber, bestKnownBlockNumber])
  const isMainnet = useMemo(() => isMainnetUtil(networks, networkID), [networks, networkID])
  const onOpenValidTarget = useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation()
      const explorerUrl = getExplorerUrl(isMainnet)
      openExternal(`${explorerUrl}/block/${validTarget}`)
    },
    [isMainnet, validTarget]
  )
  const isMigrate = useMigrate()
  const { isSetStartBlockShown, openDialog, closeDialog, onConfirm } = useSetBlockNumber({
    isLightClient,
    walletID: id,
    isHomePage,
    initStartBlockNumber: walletStartBlockNumber ? Number(walletStartBlockNumber) : undefined,
  })
  const isOpenMultisigWithLight = isLightClient && window.location.href.includes(RoutePath.MultisigAddress)
  return (
    <div className={`${styles.page} ${className || ''}`}>
      <div className={styles.head}>
        {head}
        <div className={styles.rightContent}>
          <Tooltip tip={t(theme === 'dark' ? 'common.switch-to-light' : 'common.switch-to-dark')} showTriangle>
            {theme === 'dark' ? (
              <Moon className={styles.strokeSvg} onClick={onSetTheme} />
            ) : (
              <Sun className={styles.fillSvg} onClick={onSetTheme} />
            )}
          </Tooltip>
          <span className={styles.network}>
            {network ? (
              <>
                {t(netWorkTypeLabel)}
                &nbsp;
                <span className={styles.name}>{network.name}</span>
              </>
            ) : (
              t('settings.setting-tabs.network')
            )}
          </span>
          <div className={styles.syncStatus}>
            <SyncStatusComponent
              syncStatus={syncStatus}
              connectionStatus={isOpenMultisigWithLight ? 'pause' : connectionStatus}
              syncPercents={syncPercents}
              syncBlockNumbers={syncBlockNumbers}
              isLookingValidTarget={isLookingValidTarget}
              onOpenValidTarget={onOpenValidTarget}
              isMigrate={isMigrate}
              isLightClient={isLightClient}
              onOpenSetStartBlock={openDialog}
              startBlockNumber={walletStartBlockNumber}
              estimate={estimate}
            />
          </div>
        </div>
        {notice && <PageHeadNotice notice={notice} />}
      </div>
      <div className={styles.content}>
        {showWaitForFullySynced && (
          <Alert status="warn" className={styles.syncNotification}>
            {t(`messages.codes.${ErrorCode.WaitForFullySynced}`)}
            <Close className={styles.close} onClick={closeSyncNotice} />
          </Alert>
        )}
        <div className={styles.body}>{children}</div>
        <SetStartBlockNumberDialog
          show={isSetStartBlockShown}
          headerTipNumber={bestKnownBlockNumber}
          initStartBlockNumber={walletStartBlockNumber ? Number(walletStartBlockNumber) : undefined}
          isMainnet={isMainnet}
          address={addresses[0]?.address}
          onUpdateStartBlockNumber={onConfirm}
          onCancel={closeDialog}
        />
      </div>
    </div>
  )
}

export const Breadcrumbs: FC<PropsWithChildren<React.ReactNode>> = ({ children }) => {
  const childList = React.Children.toArray(children).filter(child => {
    return React.isValidElement(child)
  })

  return (
    <div className={styles.breadcrumbs}>
      {childList.map((child, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={index}>
          {index !== 0 && <span>/</span>}
          {child}
        </React.Fragment>
      ))}
    </div>
  )
}

PageContainer.displayName = 'PageContainer'
export default PageContainer
