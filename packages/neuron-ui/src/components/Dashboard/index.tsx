import React from 'react'
import WalletContext from '../../contexts/wallet'
import WalletDetail from '../WalletDetail'
import WalletWizrd from '../WalletWizard'

const Dashboard = (props: any) => (
  <WalletContext.Consumer>
    {wallet => (wallet ? <WalletDetail {...props} /> : <WalletWizrd {...props} />)}
  </WalletContext.Consumer>
)

export default Dashboard
