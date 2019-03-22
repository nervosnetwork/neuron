import React from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

const Dialog = styled.dialog.attrs({
  open: true,
})`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 999;
`

export default ({
  children,
  open,
  onClick,
}: {
  children?: React.ReactNode | string
  open?: boolean
  onClick?: any
}) => {
  if (open && children) {
    return createPortal(<Dialog onClick={onClick}>{children}</Dialog>, document.querySelector('#dialog') as HTMLElement)
  }
  return null
}
