import React from 'react'
import styled from 'styled-components'
import withProviders from './Providers'
import Notification from './Notification'
import Sidebar from './Sidebar'
import Header from './Header'
import Transfer from './Transfer'
import Cells from './Cells'

const AppContainer = styled.div`
  display: flex;
  height: 100%;
`

const MainContainer = styled.div`
  flex: 1;
  padding: 20px 40px;
`

const App = () => (
  <AppContainer>
    <Sidebar />
    <MainContainer>
      <Notification />
      <Header />
      <div id="MainContent">
        <Transfer />
        <Cells />
        <p>Main Content goes here</p>
      </div>
    </MainContainer>
  </AppContainer>
)

export default withProviders(App)
