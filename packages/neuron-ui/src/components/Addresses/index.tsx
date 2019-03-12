import React from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ContentProps } from '../../containers/MainContent'
import { actionCreators } from '../../containers/MainContent/reducer'
import { Routes } from '../../utils/const'

export default (props: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const [t] = useTranslation()

  return (
    <>
      <div>
        <Link to={Routes.CreateWallet}>{t('Create Wallet')}</Link>
      </div>
      <div>
        <Link to={Routes.ImportWallet}>{t('Import Wallet')}</Link>
      </div>
      <div>
        <button type="submit" onClick={() => props.dispatch(actionCreators.deleteWallet('target address'))}>
          {t('Delete Wallet')}
        </button>
      </div>
      <div>
        <button type="submit" onClick={() => props.dispatch(actionCreators.exportWallet())}>
          {t('Export Wallet')}
        </button>
      </div>
    </>
  )
}
