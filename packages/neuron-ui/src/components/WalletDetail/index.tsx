import React, { useContext } from 'react'
import WalletContext from '../../contexts/Wallet'

const WalletDetail = () => {
  const wallet = useContext(WalletContext)

  return wallet.name ? (
    <>
      <h1>{wallet.name}</h1>
      <div
        style={{
          height: '1200px',
        }}
      >
        Simulate long content...
        <div>{JSON.stringify(wallet)}</div>
      </div>
    </>
  ) : (
    <div>No Wallet</div>
  )
}

export default WalletDetail
