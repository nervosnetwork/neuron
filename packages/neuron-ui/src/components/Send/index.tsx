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
import { AddCircle as AddIcon, SubtractCircle as RemoveIcon } from 'grommet-icons'

import TransactionFeePanel from 'components/TransactionFeePanel'
import QRScanner from 'widgets/QRScanner'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import appState from 'states/initStates/app'

import { PlaceHolders, CapacityUnit } from 'utils/const'
import { shannonToCKBFormatter, priceToFee } from 'utils/formatters'

import { useInitialize } from './hooks'

export interface TransactionOutput {
  address: string
  amount: string
  unit: CapacityUnit
}

const Send = ({
  app: { send = appState.send },
  wallet: { id: walletID = '', sending = false, balance = '' },
  dispatch,
  history,
  match: {
    params: { address = '' },
  },
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps<{ address: string }>>) => {
  const { t } = useTranslation()
  const {
    updateTransactionOutput,
    onItemChange,
    onSubmit,
    addTransactionOutput,
    removeTransactionOutput,
    updateTransactionPrice,
    onDescriptionChange,
    onClear,
  } = useInitialize(address, send.outputs, dispatch, history)
  const leftStackWidth = '70%'
  const labelWidth = '140px'
  const actionSpacer = (
    <Stack.Item styles={{ root: { width: '48px' } }}>
      <span> </span>
    </Stack.Item>
  )

  return (
    <Stack verticalFill tokens={{ childrenGap: 15 }} padding="20px 0 0 0">
      <Stack.Item>
        <List
          items={send.outputs || []}
          onRenderCell={(item, idx) => {
            if (undefined === item || undefined === idx) {
              return null
            }
            return (
              <Stack tokens={{ childrenGap: 15 }}>
                <Stack horizontal verticalAlign="end" horizontalAlign="space-between">
                  <Stack
                    horizontal
                    verticalAlign="end"
                    styles={{ root: { width: leftStackWidth } }}
                    tokens={{ childrenGap: 20 }}
                  >
                    <Stack.Item styles={{ root: { width: labelWidth } }}>
                      <Label>{t('send.address')}</Label>
                    </Stack.Item>
                    <Stack.Item styles={{ root: { flex: 1 } }}>
                      <TextField
                        disabled={sending}
                        value={item.address || ''}
                        onChange={onItemChange('address', idx)}
                        placeholder={PlaceHolders.send.Address}
                        required
                      />
                    </Stack.Item>
                    <Stack.Item styles={{ root: { width: '48px' } }}>
                      <QRScanner
                        title={t('send.scan-to-get-address')}
                        label={t('send.address')}
                        onConfirm={(data: string) => updateTransactionOutput('address')(idx)(data)}
                      />
                    </Stack.Item>
                  </Stack>

                  <Stack.Item>
                    {send.outputs.length > 1 ? (
                      <IconButton text={t('send.remove-this')} onClick={() => removeTransactionOutput(idx)}>
                        <RemoveIcon color="red" />
                      </IconButton>
                    ) : null}
                  </Stack.Item>
                </Stack>

                <Stack horizontal verticalAlign="end" horizontalAlign="space-between">
                  <Stack
                    horizontal
                    verticalAlign="end"
                    styles={{ root: { width: leftStackWidth } }}
                    tokens={{ childrenGap: 20 }}
                  >
                    <Stack.Item styles={{ root: { width: labelWidth } }}>
                      <Label>{t('send.amount')}</Label>
                    </Stack.Item>
                    <Stack.Item styles={{ root: { flex: 1 } }}>
                      <TextField
                        value={item.amount}
                        placeholder={PlaceHolders.send.Amount}
                        onChange={onItemChange('amount', idx)}
                        disabled={sending}
                        required
                      />
                    </Stack.Item>
                    <Stack.Item styles={{ root: { width: '43px', paddingLeft: '5px' } }}>
                      <span>(CKB)</span>
                    </Stack.Item>
                  </Stack>

                  <Stack.Item>
                    {idx === send.outputs.length - 1 ? (
                      <IconButton onClick={() => addTransactionOutput()} ariaLabel={t('send.add-one')}>
                        <AddIcon />
                      </IconButton>
                    ) : null}
                  </Stack.Item>
                </Stack>

                <Separator />
              </Stack>
            )
          }}
        />
      </Stack.Item>

      <Stack horizontal verticalAlign="end" horizontalAlign="space-between">
        <Stack horizontal verticalAlign="end" styles={{ root: { width: leftStackWidth } }} tokens={{ childrenGap: 20 }}>
          <Stack.Item styles={{ root: { width: labelWidth } }}>
            <Label>{t('send.description')}</Label>
          </Stack.Item>
          <Stack.Item styles={{ root: { flex: 1 } }}>
            <TextField id="description" alt="description" value={send.description} onChange={onDescriptionChange} />
          </Stack.Item>
          {actionSpacer}
        </Stack>
      </Stack>

      <TransactionFeePanel
        fee={shannonToCKBFormatter(priceToFee(send.price, send.cycles))}
        cycles={send.cycles}
        price={send.price}
        onPriceChange={updateTransactionPrice}
      />

      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 20 }}>
        <Stack.Item styles={{ root: { width: labelWidth } }}>
          <Label>{t('send.balance')}</Label>
        </Stack.Item>
        <Stack.Item>
          <Text>{`${shannonToCKBFormatter(balance)} CKB`}</Text>
        </Stack.Item>
      </Stack>

      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 20 }}>
        <DefaultButton type="reset" onClick={onClear}>
          {t('send.clear')}
        </DefaultButton>
        {sending ? (
          <Spinner />
        ) : (
          <PrimaryButton type="submit" onClick={onSubmit(walletID)} disabled={sending} text={t('send.send')} />
        )}
      </Stack>
    </Stack>
  )
}

Send.displayName = 'Send'

export default Send
