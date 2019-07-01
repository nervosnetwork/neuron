import React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import {
  Stack,
  List,
  MessageBar,
  TextField,
  Dropdown,
  PrimaryButton,
  DefaultButton,
  Spinner,
  MessageBarType,
} from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'

import TransactionFeePanel from 'components/TransactionFeePanel'
import QRScanner from 'widgets/QRScanner'

import { ContentProps } from 'containers/MainContent'
import { PlaceHolders, CapacityUnit } from 'utils/const'
import { useNeuronWallet } from 'utils/hooks'

import { useInitialize } from './hooks'

const Send = ({
  send,
  dispatch,
  errorMsgs,
  history,
  match: {
    params: { address },
  },
}: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ address: string }>>) => {
  const { t } = useTranslation()
  const {
    wallet: { sending, balance },
  } = useNeuronWallet()
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
        {errorMsgs.send ? (
          <MessageBar messageBarType={MessageBarType.warning}>{t(`messages.${errorMsgs.send}`)}</MessageBar>
        ) : null}
        <List
          items={send.outputs}
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
              onClick={onSubmit(id, send.outputs, send.description)}
              disabled={sending}
              text={t('send.send')}
            />
          )}
          <DefaultButton type="reset" onClick={onClear}>
            Clear
          </DefaultButton>
        </Stack>
      </Stack.Item>
    </Stack>
  )
}

Send.displayName = 'Send'

export default Send
