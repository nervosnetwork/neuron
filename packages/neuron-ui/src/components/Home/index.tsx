import React, { useContext } from 'react'
import { Redirect } from 'react-router-dom'
import WalletContext from '../../contexts/Wallet'
import { Routes } from '../../utils/const'

const Home = () => {
  const wallet = useContext(WalletContext)
  if (wallet) {
    return <Redirect to={Routes.Wallet} />
  }
  return <Redirect to={Routes.WalletWizard} />
}

export default Home
