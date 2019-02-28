import React from 'react'
import styled from 'styled-components'

// import WalletContext from '../../contexts/Wallet'
import { sendCapacity } from '../../services/UILayer'

export interface ContentProps {
  sendCapacity: (address: string, capacity: string) => void
}
const Main = styled.main`
  height: 100%;
  width: 100%;
`
const MainContent = ({ children }: { children?: any }) => {
  // const wallet = useContext(WalletContext)
  // content props passed to main contents
  const contentProps = {
    sendCapacity: (address: string, capacity: string) => {
      // TODO: verify address
      // TODO: verify capacity
      sendCapacity(address, capacity)
    },
  }
  return <Main>{React.Children.map(children, child => child && React.cloneElement(child, contentProps))}</Main>
}

MainContent.displayName = 'MainContent'

export default MainContent
