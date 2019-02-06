import React, { useContext } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import WalletContext from '../../contexts/wallet'

const Panel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
`

const Notice = () => {
  const wallet = useContext(WalletContext)
  return (
    <Panel>
      New message coming:
      {wallet.msg}
    </Panel>
  )
}

const Notification = () => createPortal(<Notice />, document.querySelector('#notification') as HTMLElement)

export default Notification
