import React, { useContext } from 'react'
import { Redirect } from 'react-router-dom'
import WalletContext from '../../contexts/wallet'
import { Routes } from '../../utils/const'

const WalletDetail = () => {
  const wallet = useContext(WalletContext)
  if (!wallet) {
    return <Redirect to={Routes.WalletWizard} />
  }

  return (
    <>
      <h1>{wallet.name}</h1>
      <div style={{ height: '1200px' }}>Simulate long content...</div>
    </>
  )
}

export default WalletDetail
