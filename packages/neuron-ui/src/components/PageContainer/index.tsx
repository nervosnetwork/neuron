import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorCode, getExplorerUrl, isMainnet, isSuccessResponse, localNumberFormatter } from 'utils'
import Alert from 'widgets/Alert'
import { Close } from 'widgets/Icons/icon'
import { ReactComponent as Sun } from 'widgets/Icons/Sun.svg'
import { ReactComponent as Moon } from 'widgets/Icons/Moon.svg'
import SyncStatusComponent from 'components/SyncStatus'
import { AppActions, useDispatch, useState as useGlobalState } from 'states'
import { isDark, openExternal, setTheme as setThemeAPI } from 'services/remote'
import styles from './pageContainer.module.scss'

const PageHeadNotice = ({ notice }: { notice: State.PageNotice }) => {
  const [t] = useTranslation()
  return (
    <Alert status={notice.status} className={styles.notice} key={notice.i18nKey}>
      {t(notice.i18nKey)}
    </Alert>
  )
}

const getNetworkTypeLable = (type: 'ckb' | 'ckb_testnet' | 'ckb_dev' | string) => {
  switch (type) {
    case 'ckb': {
      return 'settings.network.mainnet'
    }
    case 'ckb_testnet': {
      return 'settings.network.testnet'
    }
    default: {
      return 'settings.network.devnet'
    }
  }
}

type ComponentProps = { head: React.ReactNode; notice?: State.PageNotice; className?: string }
const PageContainer: React.FC<ComponentProps> = props => {
  const {
    app: { showWaitForFullySynced },
    chain: {
      syncState: { bestKnownBlockNumber, cacheTipBlockNumber, syncStatus, isLookingValidTarget, validTarget },
      connectionStatus,
      networkID,
    },
    settings: { networks },
  } = useGlobalState()
  const { children, head, notice, className } = props
  const [t] = useTranslation()
  const dispatch = useDispatch()
  const closeSyncNotice = useCallback(() => {
    dispatch({
      type: AppActions.HideWaitForFullySynced,
    })
  }, [dispatch])
  const [theme, setTheme] = useState<'dark' | 'light'>()
  useEffect(() => {
    isDark().then(res => {
      if (isSuccessResponse(res)) {
        setTheme(res.result ? 'dark' : 'light')
      }
    })
  })
  const onSetTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setThemeAPI(newTheme).then(res => {
      if (isSuccessResponse(res)) {
        setTheme(newTheme)
      }
    })
  }, [theme])
  const network = useMemo(() => networks.find(n => n.id === networkID), [networks, networkID])
  const netWorkTypeLabel = useMemo(() => (network ? getNetworkTypeLable(network.chain) : ''), [network])
  const [syncPercents, syncBlockNumbers] = useMemo(() => {
    const bestBlockNumber = Math.max(cacheTipBlockNumber, bestKnownBlockNumber)
    return [
      bestBlockNumber > 0 && cacheTipBlockNumber > 0
        ? `${+((cacheTipBlockNumber * 100) / bestBlockNumber).toFixed(2)}%`
        : '0',
      `${cacheTipBlockNumber >= 0 ? localNumberFormatter(cacheTipBlockNumber) : '-'} / ${
        bestBlockNumber >= 0 ? localNumberFormatter(bestBlockNumber) : '-'
      }`,
    ]
  }, [cacheTipBlockNumber, bestKnownBlockNumber])
  const onOpenValidTarget = useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation()
      const explorerUrl = getExplorerUrl(isMainnet(networks, networkID))
      openExternal(`${explorerUrl}/block/${validTarget}`)
    },
    [networks, networkID, validTarget]
  )
  return (
    <div className={`${styles.page} ${className || ''}`}>
      <div className={styles.head}>
        {head}
        <div className={styles.rightContent}>
          {theme === 'dark' ? <Sun onClick={onSetTheme} /> : <Moon onClick={onSetTheme} />}
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
              connectionStatus={connectionStatus}
              syncPercents={syncPercents}
              syncBlockNumbers={syncBlockNumbers}
              isLookingValidTarget={isLookingValidTarget}
              onOpenValidTarget={onOpenValidTarget}
            />
          </div>
        </div>
        {notice && <PageHeadNotice notice={notice} />}
      </div>
      {showWaitForFullySynced && (
        <Alert status="warn" className={styles.syncNotification}>
          {t(`messages.codes.${ErrorCode.WaitForFullySynced}`)}
          <Close className={styles.close} onClick={closeSyncNotice} />
        </Alert>
      )}
      {children}
    </div>
  )
}

PageContainer.displayName = 'PageContainer'
export default PageContainer
