import React from 'react'
import styled, { keyframes } from 'styled-components'
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

const appLogoSpin = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
`

const AppLogo = styled.img.attrs({
  src: logo,
})`
  height: 40vmin;
  animation: ${appLogoSpin} infinite 20s linear;
`

const App = () => (
  <div>
    <AppHeader>
      <AppLogo />
      <p>Neuron is running...</p>
    </AppHeader>
  </div>
)

export default App
