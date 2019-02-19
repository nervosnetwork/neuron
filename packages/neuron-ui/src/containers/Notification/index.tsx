import React, { useContext } from 'react'
import styled from 'styled-components'
import WalletContext from '../../contexts/wallet'

const Panel = styled.div.attrs(({ className }) => ({
  className,
}))`
  position: absolute;
  right: 0;
  bottom: 0;
  background: #ccc;
`

const Notice = () => {
  const wallet = useContext(WalletContext)
  return (
    <Panel className="notification">
      {wallet ? 'New message coming: {wallet.msg}' : ''}
    </Panel>
  )
}

export default Notice
