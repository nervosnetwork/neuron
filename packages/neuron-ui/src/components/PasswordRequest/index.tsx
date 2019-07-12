import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, Text, Label, Modal, TextField, PrimaryButton, DefaultButton } from 'office-ui-fabric-react'
import { StateWithDispatch, AppActions } from 'states/stateProvider/reducer'
import actionCreators from 'states/stateProvider/actionCreators'

const PasswordRequest = ({
  app: {
    send: { txID, outputs, description },
    passwordRequest: { walletID = '', actionType = null, password = '' },
  },
  settings: { wallets = [] },
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch>) => {
  const [t] = useTranslation()
  const wallet = useMemo(() => wallets.find(w => w.id === walletID), [walletID, wallets])
  const onDismiss = useCallback(() => {
    dispatch({
      type: AppActions.DismissPasswordRequest,
      payload: null,
    })
  }, [dispatch])

  const onConfirm = useCallback(() => {
    const params = { id: walletID, password }
    switch (actionType) {
      case 'delete': {
        dispatch(actionCreators.deleteWallet(params))
        break
      }
      case 'backup': {
        dispatch(actionCreators.backupWallet(params))
        break
      }
      case 'send': {
        dispatch(actionCreators.submitTransaction(txID, walletID, outputs, description, password))
        break
      }
      default: {
        break
      }
    }
  }, [dispatch, walletID, password, actionType, txID, description, outputs])

  const onChange = useCallback(
    (_e, value?: string) => {
      if (undefined !== value) {
        dispatch({
          type: AppActions.UpdatePassword,
          payload: value,
        })
      }
    },
    [dispatch]
  )
  const onKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        onConfirm()
      }
    },
    [onConfirm]
  )
  if (!wallet) {
    return null
  }
  return (
    <Modal isOpen={!!actionType} onDismiss={onDismiss}>
      {
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
            <DefaultButton onClick={onDismiss}>{t('common.cancel')}</DefaultButton>
            <PrimaryButton onClick={onConfirm} disabled={!password}>
              {t('common.confirm')}
            </PrimaryButton>
          </Stack>
        </Stack>
      }
    </Modal>
  )
}

PasswordRequest.displayName = 'PasswordRequest'
export default PasswordRequest
