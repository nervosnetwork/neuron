import React from 'react'
import styled from 'styled-components'
import { Grid, Row, Col } from '@smooth-ui/core-sc'
import Sidebar from './Sidebar'
import logo from '../logo.svg'

const AppHeader = styled.header`
  background-color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: black;
`

const AppLogo = styled.img.attrs({
  src: logo,
})`
  height: 20vmin;
`

const AppContainer = styled.div`
  display: flex;
`

const App = () => (
  <AppContainer>
    <Sidebar />
    <Grid fluid>
      <Row>
        <Col lg={12}>
          <AppHeader>
            <AppLogo />
            <p>Neuron is running...</p>
          </AppHeader>
        </Col>
      </Row>
    </Grid>
  </AppContainer>
)

export default App
