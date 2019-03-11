import React, { useState, useEffect } from 'react'
import { Tabs, Tab } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { Routes } from '../../utils/const'

const TabBar = (props: any) => {
  const [t] = useTranslation()
  const tabs = [Routes.SettingsGeneral, Routes.SettingsWallets, Routes.SettingsNetwork]
  const contents = ['General', 'Wallets', 'Network']
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleAction = (index: number) => {
    setSelectedIndex(index)
    props.history.push(tabs[index])
  }

  const { location } = props
  const { pathname } = location
  useEffect(() => {
    handleAction(pathname === Routes.Settings ? 0 : tabs.indexOf(pathname))
  }, [pathname])

  return (
    <Tabs
      id="settings-tabs"
      defaultActiveKey={contents[selectedIndex]}
      activeKey={contents[selectedIndex]}
      onSelect={(content: any) => handleAction(contents.indexOf(content))}
    >
      {contents.map(content => {
        return <Tab title={t(content)} eventKey={content} key={content} />
      })}
    </Tabs>
  )
}

export default TabBar
