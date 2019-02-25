import React, { useContext } from 'react'
import WalletContext from '../../contexts/Wallet'
import { ContentProps } from '../../containers/MainContent'

const WalletDetail: React.SFC<{ children?: React.ReactNode } & Partial<ContentProps>> = () => {
  const wallet = useContext(WalletContext)

  return wallet && wallet.name ? (
    <>
      <h1>{wallet.name}</h1>
      <div
        style={{
          height: '1200px',
        }}
      >
        Simulate long content...
        <div>{`balance: ${wallet.balance}`}</div>
      </div>
    </>
  ) : (
    <div>No Wallet</div>
  )
}

export default WalletDetail
