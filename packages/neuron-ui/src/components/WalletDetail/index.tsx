import React from 'react'
import WalletContext from '../../contexts/wallet'

const WalletDetail = () => (
  <WalletContext.Consumer>
    {wallet =>
      wallet && (
        <>
          <h1>{wallet.name}</h1>
          <div style={{ height: "1200px" }}>Simulate long content...</div>
        </>
      )
    }
  </WalletContext.Consumer>
)

export default WalletDetail
