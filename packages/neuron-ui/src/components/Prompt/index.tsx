import React, { useContext } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Screen from '../../widgets/Screen'

import WalletContext from '../../contexts/Wallet'
import { queryParsers } from '../../utils/parser'

const Prompt = ({
  match: {
    params: { event },
  },
  location: { search },
}: RouteComponentProps<{ event: string }>) => {
  const [t] = useTranslation()
  const { address } = useContext(WalletContext)
  const params = queryParsers.prompt(search)

  return (
    <Screen full={!address}>
      <div>{t(`messages.${event}`, params)}</div>
    </Screen>
  )
}

Prompt.displayName = 'Prompt'

export default Prompt
