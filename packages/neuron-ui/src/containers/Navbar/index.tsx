import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, NavLink, useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { NeuronWalletActions, showGlobalAlertDialog, useDispatch, useState as useGlobalState } from 'states'
import {
  VerifyExternalCkbNodeRes,
  checkForUpdates,
  getVersion,
  openExternal,
  verifyExternalCkbNode,
} from 'services/remote'
import { AppUpdater as AppUpdaterSubject } from 'services/subjects'
import Badge from 'widgets/Badge'
import Logo from 'widgets/Icons/Logo.png'
import { Overview, History, NervosDAO, Settings, Experimental, MenuExpand, ArrowNext } from 'widgets/Icons/icon'
import { RoutePath, clsx, isSuccessResponse } from 'utils'
import Tooltip from 'widgets/Tooltip'
import styles from './navbar.module.scss'

export const FULL_SCREENS = [`/wizard/`, `/keystore/`, RoutePath.ImportHardware]

const menuItems = [
  { name: 'navbar.overview', key: RoutePath.Overview, url: RoutePath.Overview, icon: <Overview /> },
  { name: 'navbar.history', key: RoutePath.History, url: RoutePath.History, icon: <History /> },
  { name: 'navbar.nervos-dao', key: RoutePath.NervosDAO, url: RoutePath.NervosDAO, icon: <NervosDAO /> },
  { name: 'navbar.settings', key: RoutePath.Settings, url: RoutePath.Settings, icon: <Settings /> },
  {
    name: 'navbar.experimental-functions',
    key: 'experimental-functions',
    icon: <Experimental />,
    url: RoutePath.SpecialAssets,
    children: [
      { name: 'navbar.special-assets', key: RoutePath.SpecialAssets, url: RoutePath.SpecialAssets },
      { name: 'navbar.s-udt', key: RoutePath.SUDTAccountList, url: RoutePath.SUDTAccountList },
    ],
  },
]

const MenuButton = ({
  menu,
  children,
  selectedKey,
  className,
}: React.PropsWithChildren<{
  menu: { key: string; name: string; url: string }
  selectedKey?: string
  className?: string
}>) => {
  const [t] = useTranslation()

  return (
    <NavLink
      to={menu.url}
      className={({ isActive }) => clsx(className, { [styles.active]: isActive || menu.key === selectedKey })}
      title={t(menu.name)}
      aria-label={t(menu.name)}
    >
      {children}
    </NavLink>
  )
}

const ONE_DAY_MILLISECONDS = 24 * 3600 * 1000

const Navbar = () => {
  const { pathname } = useLocation()
  const dispatch = useDispatch()
  const neuronWallet = useGlobalState()
  const {
    chain: { networkID },
    wallet: { name },
    settings: { wallets = [], networks = [] },
    updater: { version, isUpdated },
  } = neuronWallet
  const [t, i18n] = useTranslation()
  const [isClickedSetting, setIsClickedSetting] = useState<boolean>(false)
  const selectedKey = menuItems.find(item => item.key === pathname || item.children?.some(v => v.key === pathname))?.key

  useEffect(() => {
    const onAppUpdaterUpdates = (info: Subject.AppUpdater) => {
      dispatch({ type: NeuronWalletActions.UpdateAppUpdaterStatus, payload: info })
    }
    const appUpdaterSubscription = AppUpdaterSubject.subscribe(onAppUpdaterUpdates)

    return () => {
      appUpdaterSubscription.unsubscribe()
    }
  }, [dispatch])

  useEffect(() => {
    checkForUpdates()
    const interval = setInterval(() => {
      checkForUpdates()
    }, ONE_DAY_MILLISECONDS)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const [verifyCkbResult, setVerifyCkbResult] = useState<VerifyExternalCkbNodeRes>()

  const network = useMemo(() => networks.find(n => n.id === networkID), [networkID, networks])
  useEffect(() => {
    if (!network?.readonly) {
      verifyExternalCkbNode().then(res => {
        if (isSuccessResponse(res) && res.result) {
          setVerifyCkbResult(res.result)
        }
      })
    }
  }, [network?.readonly])

  const gotoCompatile = useCallback(() => {
    openExternal(`https://neuron.magickbase.com${i18n.language.startsWith('zh') ? '/zh' : ''}/download`)
  }, [i18n.language])

  useEffect(() => {
    // isUpdated is true or version is not empty means check update has return
    if (!verifyCkbResult || (isUpdated !== true && !version)) {
      return
    }
    if (version && verifyCkbResult.shouldUpdate) {
      showGlobalAlertDialog({
        type: 'warning',
        message: t('navbar.update-neuron-with-ckb', { version: getVersion() }),
        action: 'ok',
      })(dispatch)
    } else if (!verifyCkbResult.ckbIsCompatible) {
      showGlobalAlertDialog({
        type: 'warning',
        message: (
          <Trans
            i18nKey="navbar.ckb-node-compatible"
            values={{ version: getVersion(), btnText: t('navbar.learn-more') }}
            components={[
              <button type="button" className={styles.learnMore} onClick={gotoCompatile}>
                {t('navbar.learn-more')}
              </button>,
            ]}
          />
        ),
        action: 'ok',
      })(dispatch)
    } else if (!verifyCkbResult.withIndexer) {
      showGlobalAlertDialog({
        type: 'warning',
        message: t('navbar.ckb-without-indexer'),
        action: 'ok',
      })(dispatch)
    }
  }, [verifyCkbResult, version, isUpdated])

  useEffect(() => {
    if (pathname.includes(RoutePath.Settings)) {
      setIsClickedSetting(true)
    }
  }, [pathname])

  const [menuExpanded, setMenuExpanded] = useState(true)
  const onClickExpand = useCallback(() => {
    setMenuExpanded(v => !v)
  }, [setMenuExpanded])
  const navigate = useNavigate()

  if (!wallets.length || FULL_SCREENS.find(url => pathname.startsWith(url))) {
    return null
  }

  return (
    <aside className={styles.sidebar} data-expanded={menuExpanded}>
      <button
        type="button"
        className={styles.name}
        title={name}
        aria-label={name}
        onClick={() => navigate('/settings')}
      >
        {menuExpanded ? (
          <img src={Logo} alt="logo" />
        ) : (
          <Tooltip tip={name} placement="right" type="always-dark">
            <img src={Logo} alt="logo" />
          </Tooltip>
        )}
        {menuExpanded && (
          <Tooltip tip={name} className={styles.nameText} placement="right" type="always-dark">
            <span>{name}</span>
          </Tooltip>
        )}
      </button>
      <nav role="navigation" className={styles.navs}>
        {menuExpanded
          ? menuItems.map(item => (
              <React.Fragment key={item.key}>
                <MenuButton menu={item} selectedKey={selectedKey}>
                  {item.icon}

                  {!isClickedSetting && version && item.key === RoutePath.Settings ? (
                    <Badge>
                      <span>{t(item.name)}</span>
                    </Badge>
                  ) : (
                    <span>{t(item.name)}</span>
                  )}

                  {item.children?.length && <ArrowNext className={styles.arrow} />}
                </MenuButton>

                {item.children?.length && item.key === selectedKey && (
                  <div className={styles.child}>
                    <div className={styles.leftLine} />
                    <div>
                      {item.children.map(child => (
                        <MenuButton key={child.key} menu={child} selectedKey={pathname}>
                          {t(child.name)}
                        </MenuButton>
                      ))}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))
          : menuItems.map(item => (
              <React.Fragment key={item.key}>
                <Tooltip
                  tip={
                    item.children?.length ? (
                      <>
                        {item.children.map(child => (
                          <MenuButton
                            key={child.key}
                            menu={child}
                            selectedKey={pathname}
                            className={styles.buttonInTip}
                          >
                            {t(child.name)}
                          </MenuButton>
                        ))}
                      </>
                    ) : (
                      t(item.name)
                    )
                  }
                  placement={item.children?.length ? 'right-bottom' : 'right'}
                >
                  <MenuButton menu={item} selectedKey={selectedKey}>
                    {!isClickedSetting && version && item.key === RoutePath.Settings ? (
                      <Badge className={styles.unexpandedBadge}>{item.icon}</Badge>
                    ) : (
                      item.icon
                    )}
                  </MenuButton>
                </Tooltip>
              </React.Fragment>
            ))}
      </nav>
      <div className={styles.showExpand}>
        <MenuExpand className={styles.expand} onClick={onClickExpand} data-expanded={menuExpanded} />
      </div>
    </aside>
  )
}

Navbar.displayName = 'Navbar'

const Container = (props: any) => createPortal(<Navbar {...props} />, document.querySelector('navbar') as HTMLElement)

export default Container
