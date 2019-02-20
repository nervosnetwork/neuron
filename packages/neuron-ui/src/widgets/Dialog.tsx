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
`

export default ({ children, open }: { children?: React.ReactNode | string; open?: boolean }) => {
  if (open && children) {
    return createPortal(<Dialog>{children}</Dialog>, document.querySelector('.modal') as HTMLElement)
  }
  return null
}
