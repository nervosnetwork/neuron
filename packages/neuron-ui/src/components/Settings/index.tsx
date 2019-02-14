import React from 'react'
import styled from 'styled-components'
import { Launch } from 'grommet-icons'

export const FullView = styled.div`
  background-color: white;
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  box-sizing: border-box;
`

const WelcomeDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 80px;
  .buttonGroup {
    button {
      height: 40px;
      width: 140px;
      cursor: pointer;
    }
  }
`

export default (props: any) => (
  <WelcomeDiv>
    <div style={{ textAlign: 'center' }}>
      <Launch size="large" />
      <h1>Create or import your first wallet</h1>
      <div className="buttonGroup">
        <button
          style={{ float: 'left' }}
          type="button"
          onKeyPress={() => {
            //   for users with physical disabilities who cannot use a mouse
          }}
          onClick={() => {
            props.history.push('/settings/createWallet')
          }}
        >
          Create New Wallet
        </button>
        <button
          style={{ float: 'right' }}
          type="button"
          onKeyPress={() => {
            //   for users with physical disabilities who cannot use a mouse
          }}
          onClick={() => {
            props.history.push('/settings/importWallet')
          }}
        >
          Import Wallet
        </button>
      </div>
    </div>
  </WelcomeDiv>
)
