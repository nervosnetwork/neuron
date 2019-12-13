import React, { useCallback, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TooltipHost, IconButton } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import QRCode from 'widgets/QRCode'
import { addPopup } from 'states/stateProvider/actionCreators'
import * as styles from './receive.module.scss'

const Receive = ({
  wallet: { addresses = [] },
  match: { params },
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps<{ address: string }>>) => {
  const [t] = useTranslation()

  const accountAddress = useMemo(
    () =>
      params.address ||
      (addresses.find(addr => addr.type === 0 && addr.txCount === 0) || { address: '' }).address ||
      '',
    [params, addresses]
  )

  const copyAddress = useCallback(() => {
    window.navigator.clipboard.writeText(accountAddress)
    addPopup('addr-copied')(dispatch)
  }, [accountAddress, dispatch])

  const Address = useMemo(
    () => (
      <div className={styles.address}>
        <TooltipHost content={t('receive.click-to-copy')} calloutProps={{ gapSpace: 0 }}>
          <>
            <input readOnly value={accountAddress} onClick={copyAddress} />
            <IconButton iconProps={{ iconName: 'Copy' }} onClick={copyAddress} />
          </>
        </TooltipHost>
      </div>
    ),
    [copyAddress, accountAddress, t]
  )

  if (!accountAddress) {
    return <div>{t('receive.address-not-found')}</div>
  }

  return (
    <>
      <QRCode value={accountAddress} size={256} includeMargin dispatch={dispatch} />
      {Address}
      <p className={styles.notation}>{t('receive.prompt')}</p>
    </>
  )
}

Receive.displayName = 'Receive'

export default Receive
