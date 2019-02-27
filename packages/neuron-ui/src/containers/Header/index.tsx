import React, { useContext } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { FormattedMessage, FormattedDate } from 'react-intl'
import NetworkStatusHeader from '../../components/Network'
import SettingsContext from '../../contexts/Settings'
import locals from '../../locale'

const AppHeader = styled.div`
  height: 100%;
  border-bottom: solid 1px #ccc;
`

const Header = () => {
  const settingsContext = useContext(SettingsContext)
  return (
    <AppHeader>
      <NetworkStatusHeader />
      <select
        onChange={(e: any) => {
          const v = `${e.target.value}`
          settingsContext.switchLanguage(v)
        }}
      >
        {Object.keys(locals).map((local: string) => {
          return (
            <option key={local} value={local}>
              {local}
            </option>
          )
        })}
      </select>
      <FormattedDate value={new Date()} />
      <FormattedMessage id="Sidebar.Wallet" />
    </AppHeader>
  )
}
const Container = () => {
  return createPortal(<Header />, document.querySelector('.header') as HTMLElement)
}

export default Container
