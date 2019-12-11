import React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Stack,
  Label,
  Text,
  List,
  TextField,
  PrimaryButton,
  DefaultButton,
  IconButton,
  Spinner,
  Separator,
} from 'office-ui-fabric-react'

import TransactionFeePanel from 'components/TransactionFeePanel'
import QRScanner from 'widgets/QRScanner'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import appState from 'states/initStates/app'

import { PlaceHolders, CapacityUnit, ErrorCode, MAINNET_TAG } from 'utils/const'
import { shannonToCKBFormatter, localNumberFormatter } from 'utils/formatters'

import { verifyTotalAmount, verifyTransactionOutputs } from 'utils/validators'
import { useInitialize } from './hooks'

export interface TransactionOutput {
  address: string
  amount: string
  unit: CapacityUnit
}

const Send = ({
  app: {
    send = appState.send,
    loadings: { sending = false },
  },
  wallet: { id: walletID = '', balance = '' },
  chain: { networkID, connectionStatus },
  settings: { networks = [] },
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps<{ address: string }>>) => {
  const { t } = useTranslation()
  const {
    outputs,
    fee,
    totalAmount,
    setTotalAmount,
    useOnTransactionChange,
    onItemChange,
    onSubmit,
    addTransactionOutput,
    removeTransactionOutput,
    updateTransactionPrice,
    onDescriptionChange,
    onGetAddressErrorMessage,
    onGetAmountErrorMessage,
    onClear,
    errorMessage,
    setErrorMessage,
    isSendMax,
    onSendMaxClick,
  } = useInitialize(walletID, send.outputs, send.generatedTx, send.price, sending, dispatch, t)
  useOnTransactionChange(walletID, outputs, send.price, dispatch, isSendMax, setTotalAmount, setErrorMessage)
  const leftStackWidth = '70%'
  const labelWidth = '140px'

  const errorMessageUnderTotal = verifyTotalAmount(totalAmount, fee, balance)
    ? errorMessage
    : t(`messages.codes.${ErrorCode.AmountNotEnough}`)
  const network = networks.find(n => n.id === networkID)
  const isMainnet = (network && network.chain === MAINNET_TAG) || false

  return (
    <Stack verticalFill tokens={{ childrenGap: 15, padding: '20px 0 0 0' }}>
      <Stack.Item>
        <List
          items={outputs}
          onRenderCell={(item, idx) => {
            if (undefined === item || undefined === idx) {
              return null
            }
            return (
              <Stack tokens={{ childrenGap: 15 }}>
                <Stack horizontal verticalAlign="end" horizontalAlign="space-between">
                  <Stack
                    horizontal
                    verticalAlign="start"
                    styles={{ root: { width: leftStackWidth } }}
                    tokens={{ childrenGap: 20 }}
                  >
                    <Stack.Item styles={{ root: { width: labelWidth } }}>
                      <Label>{t('send.address')}</Label>
                    </Stack.Item>
                    <Stack.Item styles={{ root: { flex: 1 } }}>
                      <TextField
                        data-field="address"
                        data-idx={idx}
                        disabled={item.disabled}
                        value={item.address || ''}
                        onChange={onItemChange}
                        required
                        validateOnLoad={false}
                        onGetErrorMessage={onGetAddressErrorMessage(isMainnet)}
                      />
                    </Stack.Item>
                    <Stack styles={{ root: { width: '48px' } }} verticalAlign="start">
                      <QRScanner
                        title={t('send.scan-to-get-address')}
                        label={t('send.address')}
                        onConfirm={(data: string) => {
                          const e = { target: { dataset: { field: 'address', idx } } }
                          onItemChange(e, data)
                        }}
                      />
                    </Stack>
                  </Stack>

                  <Stack.Item>
                    {outputs.length > 1 ? (
                      <IconButton
                        disabled={isSendMax}
                        iconProps={{ iconName: isSendMax ? 'DisabledRemove' : 'Remove' }}
                        text={t('send.remove-this')}
                        onClick={() => removeTransactionOutput(idx)}
                      />
                    ) : null}
                  </Stack.Item>
                </Stack>

                <Stack horizontal verticalAlign="end" horizontalAlign="space-between">
                  <Stack
                    horizontal
                    verticalAlign="start"
                    styles={{ root: { width: leftStackWidth } }}
                    tokens={{ childrenGap: 20 }}
                  >
                    <Stack.Item styles={{ root: { width: labelWidth } }}>
                      <Label>{t('send.amount')}</Label>
                    </Stack.Item>
                    <Stack.Item styles={{ root: { flex: 1 } }}>
                      <TextField
                        data-field="amount"
                        data-idx={idx}
                        value={localNumberFormatter(item.amount)}
                        placeholder={isSendMax ? PlaceHolders.send.Calculating : PlaceHolders.send.Amount}
                        onChange={onItemChange}
                        disabled={item.disabled}
                        required
                        validateOnLoad={false}
                        onGetErrorMessage={onGetAmountErrorMessage}
                      />
                    </Stack.Item>
                    <Stack.Item styles={{ root: { width: '43px', paddingLeft: '5px' } }}>
                      <span>(CKB)</span>
                    </Stack.Item>
                  </Stack>

                  <Stack.Item>
                    {idx === outputs.length - 1 ? (
                      <Stack horizontal>
                        <DefaultButton
                          onClick={onSendMaxClick}
                          style={{
                            boxShadow: isSendMax ? 'inset 0 0 5px #000' : 'none',
                          }}
                          disabled={!verifyTransactionOutputs(outputs, true)}
                        >
                          Max
                        </DefaultButton>
                        <IconButton
                          disabled={!verifyTransactionOutputs(outputs, false) || isSendMax}
                          iconProps={{
                            iconName: !verifyTransactionOutputs(outputs, false) || isSendMax ? 'DisabledAdd' : 'Add',
                          }}
                          onClick={() => addTransactionOutput()}
                          ariaLabel={t('send.add-one')}
                        />
                      </Stack>
                    ) : null}
                  </Stack.Item>
                </Stack>
                <Separator />
              </Stack>
            )
          }}
        />
      </Stack.Item>

      <Stack
        verticalAlign="start"
        horizontalAlign="space-between"
        tokens={{ childrenGap: 20 }}
        styles={{ root: { marginRight: '97px' } }}
      >
        <Stack
          horizontal
          verticalAlign="start"
          styles={{
            root: {
              width: leftStackWidth,
              display: outputs.length > 1 || errorMessageUnderTotal ? 'flex' : 'none',
            },
          }}
          tokens={{ childrenGap: 20 }}
        >
          <Stack.Item styles={{ root: { width: labelWidth } }}>
            <Label>{t('send.total-amount')}</Label>
          </Stack.Item>
          <Stack.Item styles={{ root: { flex: 1 } }}>
            <TextField
              id="total-amount"
              alt={t('send.total-amount')}
              value={`${shannonToCKBFormatter(totalAmount)} CKB`}
              readOnly
              errorMessage={errorMessageUnderTotal}
            />
          </Stack.Item>
        </Stack>
        <Stack horizontal verticalAlign="end" styles={{ root: { width: leftStackWidth } }} tokens={{ childrenGap: 20 }}>
          <Stack.Item styles={{ root: { width: labelWidth } }}>
            <Label>{t('send.description')}</Label>
          </Stack.Item>
          <Stack.Item styles={{ root: { flex: 1 } }}>
            <TextField
              id="description"
              alt={t('send.description')}
              value={send.description}
              onChange={onDescriptionChange}
            />
          </Stack.Item>
        </Stack>
      </Stack>

      <TransactionFeePanel fee={shannonToCKBFormatter(fee)} price={send.price} onPriceChange={updateTransactionPrice} />

      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 20 }}>
        <Stack.Item styles={{ root: { width: labelWidth } }}>
          <Label>{t('send.balance')}</Label>
        </Stack.Item>
        <Stack.Item>
          <Text>{`${shannonToCKBFormatter(balance)} CKB`}</Text>
        </Stack.Item>
      </Stack>

      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }}>
        <DefaultButton type="reset" onClick={onClear} disabled={isSendMax}>
          {t('send.clear')}
        </DefaultButton>
        {sending ? (
          <Spinner />
        ) : (
          <PrimaryButton
            type="submit"
            onClick={onSubmit(walletID)}
            disabled={connectionStatus === 'offline' || sending || !!errorMessageUnderTotal || !send.generatedTx}
            text={t('send.send')}
          />
        )}
      </Stack>
    </Stack>
  )
}

Send.displayName = 'Send'

export default Send
