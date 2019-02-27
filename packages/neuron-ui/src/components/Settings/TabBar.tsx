import React, { useEffect } from 'react'
import styled from 'styled-components'
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
const TabBar = (props: any) => {
  useEffect(() => {
    props.history.push(Routes.SettingsGeneral)
  }, [])

  return (
    <TabBarPanel>
      <TabItem
        onClick={() => {
          props.history.push(Routes.SettingsGeneral)
        }}
      >
        General
      </TabItem>
      <TabItem
        onClick={() => {
          props.history.push(Routes.SettingsWallets)
        }}
      >
        Wallets
      </TabItem>
      <TabItem
        onClick={() => {
          props.history.push(Routes.SettingsNetwork)
        }}
      >
        Network
      </TabItem>
    </TabBarPanel>
  )
}

export default TabBar
