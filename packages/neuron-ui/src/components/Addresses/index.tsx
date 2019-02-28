import React from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { ContentProps } from '../../containers/MainContent'
import { Routes } from '../../utils/const'

export default (props: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => (
  <>
    <div>
      <Link to={Routes.CreateWallet}>Create Wallet</Link>
    </div>
    <div>
      <Link to={Routes.ImportWallet}>Import Wallet</Link>
    </div>
    <div>
      <button type="submit" onClick={() => props.dispatch(props.actionCreators.deleteWallet('target address'))}>
        Delete Address
      </button>
    </div>
    <div>
      <button type="submit" onClick={() => props.dispatch(props.actionCreators.exportWallet())}>
        Export Wallet
      </button>
    </div>
  </>
)
