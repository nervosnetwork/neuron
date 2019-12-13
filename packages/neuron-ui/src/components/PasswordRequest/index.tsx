import React, { useCallback, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Text, Label, Modal, TextField, PrimaryButton, DefaultButton } from 'office-ui-fabric-react'
import { StateWithDispatch, AppActions } from 'states/stateProvider/reducer'
import { sendTransaction, deleteWallet, backupWallet } from 'states/stateProvider/actionCreators'

const PasswordRequest = ({
  app: {
    send: { description, generatedTx },
    loadings: { sending: isSending = false },
    passwordRequest: { walletID = '', actionType = null, password = '' },
  },
  settings: { wallets = [] },
  history,
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
  const wallet = useMemo(() => wallets.find(w => w.id === walletID), [walletID, wallets])
  const onDismiss = useCallback(() => {
    dispatch({
      type: AppActions.DismissPasswordRequest,
      payload: null,
    })
  }, [dispatch])

  const onConfirm = useCallback(() => {
    switch (actionType) {
      case 'send': {
        if (isSending) {
          break
        }
        sendTransaction({
          walletID,
          tx: generatedTx,
          description,
          password,
        })(dispatch, history)
        break
      }
      case 'delete': {
        deleteWallet({
          id: walletID,
          password,
        })(dispatch)
        break
      }
      case 'backup': {
        backupWallet({
          id: walletID,
          password,
        })(dispatch)
        break
      }
      default: {
        break
      }
    }
  }, [dispatch, walletID, password, actionType, description, history, isSending, generatedTx])

  const onChange = useCallback(
    (_e, value?: string) => {
      if (undefined !== value) {
        if (/\s/.test(value)) {
          return
        }
        dispatch({
          type: AppActions.UpdatePassword,
          payload: value,
        })
      }
    },
    [dispatch]
  )
  const disabled = !password || (actionType === 'send' && isSending)
  const onKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !disabled) {
        onConfirm()
      }
    },
    [onConfirm, disabled]
  )
  if (!wallet) {
    return null
  }
  return (
    <Modal isOpen={!!actionType} onDismiss={onDismiss}>
      <Stack
        tokens={{ childrenGap: 15 }}
        styles={{
          root: {
            padding: 30,
          },
        }}
      >
        <Text variant="xLarge">{t(`password-request.${actionType}.title`, { name: wallet ? wallet.name : '' })}</Text>
        <Label required title="password">
          {t('password-request.password')}
        </Label>
        <TextField value={password} type="password" onChange={onChange} autoFocus onKeyPress={onKeyPress} />
        <Stack horizontalAlign="end" horizontal tokens={{ childrenGap: 15 }}>
          <DefaultButton onClick={onDismiss} ariaLabel="cancel">
            {t('common.cancel')}
          </DefaultButton>
          <PrimaryButton type="submit" onClick={onConfirm} disabled={disabled} ariaLabel="confirm">
            {t('common.confirm')}
          </PrimaryButton>
        </Stack>
      </Stack>
    </Modal>
  )
}

PasswordRequest.displayName = 'PasswordRequest'
export default PasswordRequest
