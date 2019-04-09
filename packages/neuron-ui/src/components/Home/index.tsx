import React from 'react'
import { Redirect } from 'react-router-dom'
import { Routes } from '../../utils/const'
import { useNeuronWallet } from '../../utils/hooks'

const Home = () => {
  const { wallet } = useNeuronWallet()
  if (wallet) {
    return <Redirect to={Routes.Wallet} />
  }
  return <Redirect to={Routes.WalletWizard} />
}

export default Home
