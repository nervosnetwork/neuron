import React, { useContext } from 'react'
import styled from 'styled-components'
import ModalContext from '../../contexts/modal'

import { setGuidedFlag } from '../../utils/storage'

const CreateWalletDiv = styled.div`
  display: flex
  align-items:center
  justify-content: center
  width: 80vw

`
const CreateWallet = () => <CreateWalletDiv>Your first wallet!</CreateWalletDiv>

export default () => {
  const modalContext = useContext(ModalContext)
  return (
    <div>
      <h1>Addresses</h1>
      <button
        type="button"
        onKeyPress={() => {
          //   for users with physical disabilities who cannot use a mouse
        }}
        onClick={() => {
          setGuidedFlag(true)
          modalContext.actions.showModal(CreateWallet())
        }}
      >
        New
      </button>
    </div>
  )
}
