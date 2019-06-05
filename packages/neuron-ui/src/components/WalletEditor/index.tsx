import { ContentProps } from 'containers/MainContent'
import { actionCreators } from 'containers/MainContent/reducer'
import React, { useCallback, useEffect, useMemo } from 'react'
import { Button, Card, Form } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, Link } from 'react-router-dom'
import { useNeuronWallet } from 'utils/hooks'
import InlineInput, { InputProps } from 'widgets/InlineInput'
import { Routes } from 'utils/const'
import { useAreParamsValid, useInputs, useToggleDialog, useWalletEditor } from './hooks'

export default ({
  dispatch,
  match: {
    params: { id },
  },
}: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ id: string }>>) => {
  const [t] = useTranslation()
  const {
    settings: { wallets },
  } = useNeuronWallet()

  const wallet = useMemo(() => wallets.find(w => w.id === id), [id, wallets])

  if (!wallet) {
    const label = `${t('siderbar.settings')}-${t('settings.setting-tabs.wallets')}`
    return (
      <div>
        <p>{t('messages.wallet-is-not-found')}</p>
        <Link to={Routes.SettingsWallets} className="btn btn-primary">
          {label}
        </Link>
      </div>
    )
  }

  const editor = useWalletEditor()
  const { initialize } = editor

  useEffect(() => {
    initialize(wallet.name)
  }, [id, initialize, wallet.name])

  const inputs: InputProps[] = useInputs(editor)
  const areParamsValid = useAreParamsValid(editor.name.value)
  const toggleDialog = useToggleDialog(dispatch)

  const handleConfirm = useCallback(() => {
    toggleDialog(false)
    dispatch(
      actionCreators.updateWallet({
        id: wallet.id,
        name: editor.name.value,
      }),
    )
  }, [editor.name.value, wallet.id, dispatch, toggleDialog])

  return (
    <Card>
      <Card.Header>{t('settings.wallet-manager.edit-wallet.edit-wallet')}</Card.Header>
      <Card.Body>
        <Form>
          {inputs.map(inputProps => (
            <InlineInput {...inputProps} key={inputProps.label} />
          ))}
        </Form>
        <Button type="submit" variant="primary" size="lg" block onClick={handleConfirm} disabled={!areParamsValid}>
          {t('common.save')}
        </Button>
      </Card.Body>
    </Card>
  )
}
