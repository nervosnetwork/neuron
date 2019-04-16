import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Screen from '../../widgets/Screen'
import ScreenMessages from '../ScreenMessages'
import ScreenButtonRow from '../../widgets/ScreenButtonRow'

import { Routes, MnemonicAction } from '../../utils/const'

import { useNeuronWallet } from '../../utils/hooks'
import { walletsCall } from '../../services/UILayer'

const buttons = [
  { label: 'wizard.create-new-wallet', href: `${Routes.Mnemonic}/${MnemonicAction.Create}` },
  { label: 'wizard.import-wallet', href: `${Routes.Mnemonic}/${MnemonicAction.Import}` },
]

const Wizard = () => {
  const { messages } = useNeuronWallet()
  const [t] = useTranslation()
  walletsCall.generateMnemonic()
  const message = 'wizard.create-or-import-your-first-wallet'
  return (
    <Screen>
      <ScreenMessages messages={messages} />
      <div>
        <h1>{t(message)}</h1>
        <ScreenButtonRow>
          {buttons.map(({ label, href }) => (
            <Link key={label} className="btn btn-primary" to={href}>
              {t(label)}
            </Link>
          ))}
        </ScreenButtonRow>
      </div>
    </Screen>
  )
}

Wizard.displayName = 'Wizard'

export default Wizard
