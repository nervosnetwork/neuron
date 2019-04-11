import React, { useEffect, useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'
import { Alert, Button, FormControl, Badge } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import Screen from '../../widgets/Screen'
import ScreenButtonRow from '../../widgets/ScreenButtonRow'

import { ContentProps } from '../../containers/MainContent'
import { MainActions } from '../../containers/MainContent/reducer'
import { MnemonicAction, Routes } from '../../utils/const'
import { helpersCall } from '../../services/UILayer'

const Container = styled.div`
  text-align: center;
  width: 736px;
`

const MnemonicWord = styled(Badge)`
  margin: 15px;
  padding: 5px 15px;
`
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
      helpersCall
        .generateMnemonic()
        .then(generatedMnemonic => {
          dispatch({
            type: MainActions.UpdateMnemonic,
            payload: {
              generated: generatedMnemonic,
              imported: '',
            },
          })
        })
        .catch(err => {
          dispatch({
            type: MainActions.ErrorMessage,
            payload: {
              wizard: err,
            },
          })
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

  const disableNext = type === MnemonicAction.Verify && !(generated === imported)
  const message = isCreate ? 'wizard.your-wallet-seed-is' : 'wizard.input-your-seed'

  return (
    <Screen>
      <Container>
        <h1>{t(message)}</h1>
        <FormControl as="textarea" disabled={isCreate} value={isCreate ? generated : imported} onChange={onChange} />
        {type === MnemonicAction.Verify
          ? generated
              .split(' ')
              .sort()
              .map(word => (
                <MnemonicWord pill variant="info" key={word}>
                  {word}
                </MnemonicWord>
              ))
          : null}
        {wizard ? <Alert variant="warning">{t(wizard)}</Alert> : null}
        <ScreenButtonRow>
          <Button role="button" onClick={onBack} onKeyPress={onBack}>
            {t('wizard.back')}
          </Button>
          <Button role="button" onClick={onNext} onKeyPress={onNext} disabled={disableNext}>
            {t('wizard.next')}
          </Button>
        </ScreenButtonRow>
      </Container>
    </Screen>
  )
}

Mnemonic.displayName = 'Mnemonic'

export default Mnemonic
