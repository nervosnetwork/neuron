import React, { useContext } from 'react'
import WalletContext from '../../contexts/wallet'

const WalletDetail = () => {
  const wallet = useContext(WalletContext)!
  return (
    <>
      <h1>{wallet.name}</h1>
      <div style={{ height: '1200px' }}>Simulate long content...</div>
    </>
  )
}

export default WalletDetail
