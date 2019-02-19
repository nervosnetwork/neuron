import React from 'react'

const MainContent = ({ children }: { children?: React.ReactNode }) => (
  <main className="main-content">{children}</main>
)

MainContent.displayName = 'MainContent'

export default MainContent
