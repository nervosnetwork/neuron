import React from 'react'
import ipc from '../../utils/ipc'

export interface ContentProps {
  sendCapacity: (address: string, capacity: string) => void
}

const MainContent = ({ children }: { children?: any }) => {
  // content props passed to main contents
  const contentProps = {
    sendCapacity: (address: string, capacity: string) => {
      // TODO: verify address
      // TODO: verify capacity
      ipc.sendCapacity(address, capacity)
    },
  }
  return <main>{React.Children.map(children, child => child && React.cloneElement(child, contentProps))}</main>
}

MainContent.displayName = 'MainContent'

export default MainContent
