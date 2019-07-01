import React, { useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import {
  Stack,
  MessageBar,
  MessageBarType,
  DetailsList,
  DetailsListLayoutMode,
  CheckboxVisibility,
} from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'

import { ContentProps } from 'containers/MainContent'
import { actionCreators, MainActions } from 'containers/MainContent/reducer'
import { ProviderActions } from 'containers/Providers/reducer'
import Screen from 'widgets/Screen'

import { useNeuronWallet } from 'utils/hooks'
import { localNumberFormatter } from 'utils/formatters'

const inputColumns = [
  {
    ariaLabel: 'lock hash',
    key: 'lockHash',
    name: 'Lock Hash',
    fieldName: 'lockHash',
    minWidth: 70,
  },
  {
    ariaLabel: 'outpoint block hash',
    key: 'outPointBlockHash',
    name: 'OutPoint BlockHash',
    onRender: (item: any) => <span>{item.previousOutput.blockHash || 'none'}</span>,
    minWidth: 70,
  },
  {
    ariaLabel: 'outpoint cell',
    key: 'outPointCell',
    name: 'OutPoint Cell',
    onRender: (item: any) => (
      <span>
        {item.previousOutput.cell ? `${item.previousOutput.cell.txHash}[${item.previousOutput.cell.index}]` : 'none'}
      </span>
    ),
    minWidth: 70,
  },
  {
    ariaLabel: 'capacity',
    key: 'capacity',
    name: 'Capacity',
    fieldName: 'capacity',
    minWidth: 70,
  },
]
const outputColumns = [
  {
    ariaLabel: 'index',
    key: 'index',
    name: 'Index',
    fieldName: 'index',
    minWidth: 10,
    maxWidth: 30,
  },
  {
    ariaLabel: 'lock hash',
    key: 'lockHash',
    name: 'Lock Hash',
    fieldName: 'lockHash',
    minWidth: 70,
  },
  {
    ariaLabel: 'capacity',
    key: 'capacity',
    name: 'Capacity',
    fieldName: 'capacity',
    minWidth: 70,
  },
]
const Transaction = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ hash: string }>>) => {
  const { match, errorMsgs, dispatch, providerDispatch } = props
  const [t] = useTranslation()
  const {
    chain: { transaction },
  } = useNeuronWallet()

  useEffect(() => {
    dispatch(actionCreators.getTransaction(match.params.hash))
    return () => {
      providerDispatch({
        type: ProviderActions.CleanTransaction,
      })
      dispatch({
        type: MainActions.ErrorMessage,
        payload: {
          transaction: '',
        },
      })
    }
  }, [match.params.hash, dispatch, providerDispatch])

  return (
    <Screen mode="fullscreen">
      <Stack>
        <Stack.Item>
          <b>{`${t('history.transaction-hash')}: `}</b>
          {transaction.hash}
        </Stack.Item>
        <Stack.Item>
          {errorMsgs.transaction ? (
            <MessageBar messageBarType={MessageBarType.warning}>{t(`messages.${errorMsgs.transaction}`)}</MessageBar>
          ) : null}
          <div>
            <b>{`${t('history.date')}: `}</b>
            {transaction.timestamp ? new Date(+transaction.timestamp).toLocaleString() : null}
          </div>
          <div>
            <b>{`${t('history.blockNumber')}: `}</b>
            {localNumberFormatter(transaction.blockNumber)}
          </div>
          <div>
            <b>{`${t('history.amount')}: `}</b>
            {transaction.value}
          </div>
          <div>
            <b>Inputs</b>
            <DetailsList
              checkboxVisibility={CheckboxVisibility.hidden}
              items={transaction.inputs}
              compact
              isHeaderVisible
              layoutMode={DetailsListLayoutMode.justified}
              columns={inputColumns}
            />
          </div>
          <div>
            <b>Outputs</b>
            <DetailsList
              items={transaction.outputs.map((output, index) => ({ ...output, index }))}
              checkboxVisibility={CheckboxVisibility.hidden}
              compact
              isHeaderVisible
              layoutMode={DetailsListLayoutMode.justified}
              columns={outputColumns}
            />
          </div>
        </Stack.Item>
      </Stack>
    </Screen>
  )
}

Transaction.displayName = 'Transaction'

export default Transaction
