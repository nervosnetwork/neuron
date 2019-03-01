import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Routes } from '../../utils/const'

const TabBarPanel = styled.div`
  display: flex;
  flex-direction: row;
`

const TabItem = styled.div`
  width: 200px;
  height: 40px;
  border-radius: 10px;
  text-align: center;
  line-height: 60px;
  color: black;
`

const SelectedTabItem = styled(TabItem)`
  color: blue;
`

const TabBar = (props: any) => {
  const [t] = useTranslation()
  const tabs = [Routes.SettingsGeneral, Routes.SettingsWallets, Routes.SettingsNetwork]
  const contents = ['General', 'Wallets', 'Network']
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    props.history.push(tabs[0])
  }, [])

  const handleAction = (index: number) => {
    setSelectedIndex(index)
    props.history.push(tabs[index])
  }

  return (
    <TabBarPanel>
      {contents.map((content, index) => {
        return selectedIndex === index ? (
          <SelectedTabItem
            key={content}
            onClick={() => {
              handleAction(index)
            }}
          >
            {t(content)}
          </SelectedTabItem>
        ) : (
          <TabItem
            key={content}
            onClick={() => {
              handleAction(index)
            }}
          >
            {t(content)}
          </TabItem>
        )
      })}
    </TabBarPanel>
  )
}

export default TabBar
