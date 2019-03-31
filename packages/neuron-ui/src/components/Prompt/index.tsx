import React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Screen from '../../widgets/Screen'

import { queryParsers } from '../../utils/parser'

const Prompt = ({
  match: {
    params: { event },
  },
  location: { search },
}: RouteComponentProps<{ event: string }>) => {
  const [t] = useTranslation()
  const params = queryParsers.prompt(search)

  return (
    <Screen mode="responsive">
      <div>{t(`messages.${event}`, params)}</div>
    </Screen>
  )
}

Prompt.displayName = 'Prompt'

export default Prompt
