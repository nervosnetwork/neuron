import React, { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'
import Logo from 'widgets/Icons/Logo.png'
import {
  Overview,
  Send,
  Receive,
  History,
  NervosDAO,
  Settings,
  Experimental,
  ArrowOpenRight,
  MenuExpand,
} from 'widgets/Icons/icon'
import { showSettings } from 'services/remote'
import { RoutePath, useOnLocaleChange } from 'utils'
import Tooltip from 'widgets/Tooltip'

// import { Migrate } from 'services/subjects'
import styles from './navbar.module.scss'

export const FULL_SCREENS = [`${RoutePath.Transaction}/`, `/wizard/`, `/keystore/`, RoutePath.ImportHardware]

const throttledShowSettings = (() => {
  const THROTTLE_TIME = 1000
  let lastRun = 0
  return (params: Parameters<typeof showSettings>[0]) => {
    if (Date.now() - lastRun < THROTTLE_TIME) {
      return false
    }
    lastRun = Date.now()
    return showSettings(params)
  }
})()

const menuItems = [
  { name: 'navbar.overview', key: RoutePath.Overview, url: RoutePath.Overview, icon: <Overview /> },
  { name: 'navbar.send', key: RoutePath.Send, url: RoutePath.Send, icon: <Send /> },
  { name: 'navbar.receive', key: RoutePath.Receive, url: RoutePath.Receive, icon: <Receive /> },
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
  onClick,
  children,
  selectedKey,
  className,
}: React.PropsWithChildren<{
  menu: { key: string; name: string; url: string }
  onClick: React.MouseEventHandler<HTMLButtonElement>
  selectedKey?: string
  className?: string
}>) => {
  const [t] = useTranslation()
  return (
    <button
      type="button"
      title={t(menu.name)}
      name={t(menu.name)}
      aria-label={t(menu.name)}
      data-link={menu.url}
      data-active={menu.key === selectedKey}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  )
}

const Navbar = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const neuronWallet = useGlobalState()
  const {
    wallet: { name },
    settings: { wallets = [] },
  } = neuronWallet
  const [t, i18n] = useTranslation()
  useOnLocaleChange(i18n)
  const selectedKey = menuItems.find(item => item.key === pathname || item.children?.some(v => v.key === pathname))?.key
  const [menuExpanded, setMenuExpanded] = useState(true)
  const onClickExpand = useCallback(() => {
    setMenuExpanded(v => !v)
  }, [setMenuExpanded])
  const onClickNavItem = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      const {
        dataset: { link },
      } = e.currentTarget
      if (link) {
        navigate(link)
      }
    },
    [navigate]
  )

  // TODO remove to pages head
  // const [isMigrate, setIsMigrate] = useState(false)
  // useEffect(() => {
  //   const migrateSubscription = Migrate.subscribe(migrateStatus => {
  //     setIsMigrate(migrateStatus === 'migrating')
  //   })
  //   return () => {
  //     migrateSubscription.unsubscribe()
  //   }
  // }, [])

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
        onClick={() => throttledShowSettings({ tab: 'wallets' })}
      >
        {menuExpanded ? (
          <img src={Logo} alt="logo" />
        ) : (
          <Tooltip tip={name} placement="right">
            <img src={Logo} alt="logo" />
          </Tooltip>
        )}
        {menuExpanded && (
          <Tooltip tip={name} className={styles.nameText} placement="right">
            <span>{name}</span>
          </Tooltip>
        )}
      </button>
      <nav role="navigation" className={styles.navs}>
        {menuExpanded
          ? menuItems.map(item => (
              <React.Fragment key={item.key}>
                <MenuButton menu={item} selectedKey={selectedKey} onClick={onClickNavItem}>
                  {item.icon}
                  <span>{t(item.name)}</span>
                  {item.children?.length && <ArrowOpenRight className={styles.arrow} />}
                </MenuButton>
                {item.children?.length && item.key === selectedKey && (
                  <div className={styles.child}>
                    <div className={styles.leftLine} />
                    <div>
                      {item.children.map(child => (
                        <MenuButton key={child.key} menu={child} selectedKey={pathname} onClick={onClickNavItem}>
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
                            onClick={onClickNavItem}
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
                  <MenuButton menu={item} selectedKey={selectedKey} onClick={onClickNavItem}>
                    {item.icon}
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
