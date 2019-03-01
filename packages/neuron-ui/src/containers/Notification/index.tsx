import React, { useContext } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import WalletContext from '../../contexts/Wallet'

const Panel = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  background: #ccc;
`

const Notice = () => {
  const wallet = useContext(WalletContext)
  return wallet.msg ? <Panel>{'New message coming: {wallet.msg}'}</Panel> : null
}

const Notification = () => createPortal(<Notice />, document.querySelector('#notification') as HTMLElement)

export default Notification
