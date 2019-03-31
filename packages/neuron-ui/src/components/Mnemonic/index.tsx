import React, { useEffect, useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Alert, Button, FormControl } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import Screen from '../../widgets/Screen'
import ScreenButtonRow from '../../widgets/ScreenButtonRow'

import { ContentProps } from '../../containers/MainContent'
import { MainActions } from '../../containers/MainContent/reducer'
import mnemonicUtils from '../../utils/mnemonic'
import { MnemonicAction, Routes } from '../../utils/const'

const Mnemonic = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ type: MnemonicAction }>>) => {
  const {
    match: {
      params: { type },
    },
    mnemonic: { generated, imported },
    errorMsgs: { wizard },
    dispatch,
    history,
  } = props

  const [t] = useTranslation()

  const isCreate = type === MnemonicAction.Create

  useEffect(() => {
    if (type === MnemonicAction.Verify && !generated) {
      history.push(`${Routes.Mnemonic}/${MnemonicAction.Create}`)
    } else if (!isCreate) {
      dispatch({
        type: MainActions.UpdateMnemonic,
        payload: { imported: '' },
      })
    } else {
      dispatch({
        type: MainActions.UpdateMnemonic,
        payload: {
          generated: mnemonicUtils.generateMnemonic(),
          imported: '',
        },
      })
    }
  }, [type])

  const onChange = useCallback(
    (e: React.FormEvent<{ value: string }>) => {
      if (isCreate) return
      const { value } = e.currentTarget
      dispatch({
        type: MainActions.UpdateMnemonic,
        payload: { imported: value },
      })
    },
    [type],
  )

  const onBack = useCallback(() => {
    history.goBack()
  }, [])

  const onNext = useCallback(() => {
    switch (type) {
      case MnemonicAction.Create: {
        history.push(`${Routes.Mnemonic}/${MnemonicAction.Verify}`)
        break
      }
      case MnemonicAction.Verify:
      case MnemonicAction.Import: {
        history.push(Routes.WalletSubmission)
        break
      }
      default: {
        break
      }
    }
  }, [type])

  const disableNext = type === MnemonicAction.Verify && !mnemonicUtils.verifyMnemonic(generated, imported)
  const message = isCreate ? 'wizard.your-wallet-seed-is' : 'wizard.input-your-seed'

  return (
    <Screen>
      <div>
        <h1>{t(message)}</h1>
        <FormControl as="textarea" disabled={isCreate} value={isCreate ? generated : imported} onChange={onChange} />
        {wizard ? <Alert variant="warning">{t(wizard)}</Alert> : null}
        <ScreenButtonRow>
          <Button role="button" onClick={onBack} onKeyPress={onBack}>
            {t('wizard.back')}
          </Button>
          <Button role="button" onClick={onNext} onKeyPress={onNext} disabled={disableNext}>
            {t('wizard.next')}
          </Button>
        </ScreenButtonRow>
      </div>
    </Screen>
  )
}

Mnemonic.displayName = 'Mnemonic'

export default Mnemonic
