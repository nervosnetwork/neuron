import React from 'react'
import styled from 'styled-components'
import Sidebar from './Sidebar'
import Header from './Header'

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
      <Header />
      <div>
        <p>Main Content goes here</p>
      </div>
    </MainContainer>
  </AppContainer>
)

export default App
