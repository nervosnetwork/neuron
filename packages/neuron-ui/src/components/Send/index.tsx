import React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, List, TextField, Dropdown, PrimaryButton, DefaultButton, Spinner } from 'office-ui-fabric-react'

import TransactionFeePanel from 'components/TransactionFeePanel'
import QRScanner from 'widgets/QRScanner'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import appState from 'states/initStates/app'

import { PlaceHolders, CapacityUnit } from 'utils/const'

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
    id,
    updateTransactionOutput,
    onItemChange,
    onSubmit,
    onCapacityUnitChange,
    addTransactionOutput,
    removeTransactionOutput,
    updateTransactionPrice,
    onDescriptionChange,
    onClear,
  } = useInitialize(address, dispatch, history)

  return (
    <Stack>
      <Stack.Item>
        <List
          items={send.outputs || []}
          onRenderCell={(item, idx) => {
            if (undefined === item || undefined === idx) return null
            return (
              <Stack tokens={{ childrenGap: 15 }}>
                <Stack horizontal>
                  <TextField
                    styles={{
                      root: {
                        flex: 1,
                      },
                    }}
                    disabled={sending}
                    value={item.address || ''}
                    onChange={onItemChange('address', idx)}
                    placeholder={PlaceHolders.send.Address}
                    label={t('send.address')}
                    underlined
                    required
                  />
                  <div
                    style={{
                      padding: 0,
                    }}
                  >
                    <QRScanner
                      title={t('send.scan-to-get-address')}
                      label={t('send.address')}
                      onConfirm={(data: string) => updateTransactionOutput('address')(idx)(data)}
                    />
                  </div>
                </Stack>
                <Stack horizontal>
                  <TextField
                    styles={{
                      root: { flex: 1 },
                    }}
                    label={t('send.amount')}
                    value={item.amount}
                    placeholder={PlaceHolders.send.Amount}
                    onChange={onItemChange('amount', idx)}
                    disabled={sending}
                    underlined
                    required
                  />
                  <Dropdown
                    selectedKey={item.unit}
                    options={[
                      { key: CapacityUnit.CKB, text: 'CKB' },
                      { key: CapacityUnit.CKKB, text: 'CKKB' },
                      { key: CapacityUnit.CKGB, text: 'CKGB' },
                    ]}
                    onChange={onCapacityUnitChange(idx)}
                  />
                </Stack>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {send.outputs.length > 1 ? (
                    <PrimaryButton text={t('send.remove-this')} onClick={() => removeTransactionOutput(idx)} />
                  ) : null}
                  {idx === send.outputs.length - 1 ? (
                    <PrimaryButton onClick={() => addTransactionOutput()} text={t('send.add-one')} />
                  ) : null}
                </div>
              </Stack>
            )
          }}
        />

        <TextField
          placeholder={t('send.description')}
          id="description"
          alt="description"
          value={send.description}
          onChange={onDescriptionChange}
        />
        <TransactionFeePanel fee="10" cycles="10" price={send.price} onPriceChange={updateTransactionPrice} />
        <div>{`${t('send.balance')}: ${balance}`}</div>
        <Stack horizontal horizontalAlign="space-around">
          {sending ? (
            <Spinner />
          ) : (
            <PrimaryButton
              type="submit"
              onClick={onSubmit(id, walletID, send.outputs, send.description)}
              disabled={sending}
              text={t('send.send')}
            />
          )}
          <DefaultButton type="reset" onClick={onClear}>
            {t('send.clear')}
          </DefaultButton>
        </Stack>
      </Stack.Item>
    </Stack>
  )
}

Send.displayName = 'Send'

export default Send
