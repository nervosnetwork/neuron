import React, { useContext } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

import ModalContext from '../../contexts/modal'

import { getGuidedFlag } from '../../utils/storage'

const AppModal = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: ${(props: { show: boolean }) => (props.show ? 'flex' : 'none')};
  align-items:center
  justify-content: center
  z-index: 999;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  >div:nth-child(1){
    border-radius: 5px 5px;
    padding: 20px;
    background-color: rgba(255, 255, 255, 1);;
    position: relative;
    >div:nth-child(1){
      width: 50vw;
      height: 50vh;
    }
    .modal_close{
      width: 20px;
      height: 20px;
      font-size: 20px;
      position: absolute;
      top: 0;
      right: 0;
      &:hover{
        cursor: pointer;
        color: red;
      }
    }
  }


`

const Modal = () => (
  <ModalContext.Consumer>
    {(modal: any) => (
      <AppModal
        show={modal.show}
        onClick={() => {
          modal.actions.hideModal()
        }}
      >
        <div
          role="button"
          tabIndex={-1}
          onKeyPress={() => {
            //   for users with physical disabilities who cannot use a mouse
          }}
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation()
          }}
        >
          {modal.content}
          <div
            role="button"
            tabIndex={-1}
            className="modal_close"
            onKeyPress={() => {
              //   for users with physical disabilities who cannot use a mouse
            }}
            onClick={() => {
              modal.actions.hideModal()
            }}
          >
            x
          </div>
        </div>
      </AppModal>
    )}
  </ModalContext.Consumer>
)

let openGuider: boolean = !getGuidedFlag()

const Container = (props: any) => {
  const modalContext = useContext(ModalContext)
  // console.log(props)
  if (openGuider) {
    modalContext.actions.showModal(
      <div style={{ width: '30vw', height: '20vh', textAlign: 'center' }}>
        <p>Welcome to use the CKB wallet!!! </p>
        <button
          type="button"
          onKeyPress={() => {
            //   for users with physical disabilities who cannot use a mouse
          }}
          onClick={() => {
            modalContext.actions.hideModal()
            props.history.push('/addresses')
          }}
        >
          go create!
        </button>
      </div>,
    )
  }
  openGuider = false
  return createPortal(<Modal />, document.querySelector('.modal') as HTMLElement)
}

export default Container
