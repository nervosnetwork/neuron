import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'
import PageContainer from 'components/PageContainer'
import SignleAddressReceive from './singleAddressReceive'
import MultiAddressReceive from './multiAddressReceive'

const Receive = () => {
  const {
    app: { pageNotice },
    wallet,
  } = useGlobalState()
  const [t] = useTranslation()
  const { address } = useParams<{ address: string }>()
  const { addresses, id: walletId } = wallet
  const isSingleAddress = addresses.length === 1

  const accountAddress = useMemo(() => {
    if (isSingleAddress) {
      return addresses[0].address
    }
    return (address || addresses.find(a => a.type === 0 && a.txCount === 0)?.address) ?? ''
  }, [address, addresses, isSingleAddress])

  if (!accountAddress) {
    return <div>{t('receive.address-not-found')}</div>
  }

  return (
    <PageContainer
      onContextMenu={e => {
        e.stopPropagation()
        e.preventDefault()
      }}
      head={t('receive.title')}
      notice={pageNotice}
    >
      {isSingleAddress ? (
        <SignleAddressReceive address={accountAddress} wallet={wallet} />
      ) : (
        <MultiAddressReceive address={accountAddress} addresses={addresses} walletId={walletId} />
      )}
    </PageContainer>
  )
}

Receive.displayName = 'Receive'

export default Receive
