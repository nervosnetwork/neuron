import React, { useContext } from 'react'
import WalletContext from '../../contexts/Wallet'

export default () => {
  const walletContext = useContext(WalletContext)
  return (
    <>
      <h1>create wallet success!!</h1>
      <div>your wallet info is ...</div>
      <div>{JSON.stringify(walletContext)}</div>
    </>
  )
}
