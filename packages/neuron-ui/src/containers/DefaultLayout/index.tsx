import React from 'react'
import styled from 'styled-components'
import Sidebar from '../Sidebar'
import Header from '../Header'
import MainContent from '../MainContent'
import Notification from '../Notification'

const DefaultLayoutDiv = styled.div`
  display: grid;
  grid-template: 'sidebar header' 60px 'sidebar content' 1fr 'sidebar content' 1fr / 240px 1fr;
  column-gap: 40px;
  height: 100vh;
  .sidebar {
    grid-area: sidebar;
    background-color: white;
  }

  .header {
    grid-area: header;
  }

  .main-content {
    grid-area: content;
    overflow: auto;
  }

  .notification {
    grid-area: 4/3/5/4;
  }
`
export default (Comp: React.ComponentType) => (props: React.Props<any>) => (
  <DefaultLayoutDiv>
    <Sidebar />
    <Header />
    <MainContent>
      <Comp {...props} />
    </MainContent>
    <Notification />
  </DefaultLayoutDiv>
)
