import React, { useEffect, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, DetailsList, Text, DetailsListLayoutMode, CheckboxVisibility, IColumn } from 'office-ui-fabric-react'

import { AppActions, StateWithDispatch } from 'states/stateProvider/reducer'
import { updateTransaction } from 'states/stateProvider/actionCreators'
import chainState from 'states/initStates/chain'

import { localNumberFormatter, uniformTimeFormatter } from 'utils/formatters'

const MIN_CELL_WIDTH = 70

const inputColumns: IColumn[] = [
  {
    key: 'lockHash',
    name: 'Lock Hash',
    maxWidth: 300,
  },
  {
    key: 'outPointBlockHash',
    name: 'OutPoint BlockHash',
    maxWidth: 300,
    onRender: (item: any) => <span>{item.previousOutput.blockHash || 'none'}</span>,
  },
  {
    key: 'outPointCell',
    name: 'OutPoint Cell',
    onRender: (item: any) => (
      <span>
        {item.previousOutput.cell ? `${item.previousOutput.cell.txHash}[${item.previousOutput.cell.index}]` : 'none'}
      </span>
    ),
  },
  {
    key: 'capacity',
    name: 'Capacity',
  },
].map(
  (col): IColumn => ({
    minWidth: MIN_CELL_WIDTH,
    isResizable: true,
    isCollapsable: false,
    ariaLabel: col.name,
    fieldName: col.key,
    ...col,
  })
)
const outputColumns: IColumn[] = [
  {
    key: 'index',
    name: 'Index',
    minWidth: 80,
    maxWidth: 150,
  },
  {
    key: 'lockHash',
    name: 'Lock Hash',
    minWidth: 70,
    maxWidth: 300,
  },
  {
    key: 'capacity',
    name: 'Capacity',
    minWidth: 150,
  },
].map(col => ({
  isResizable: true,
  isCollapsable: false,
  ariaLabel: col.name,
  fieldName: col.key,
  ...col,
}))

const basicInfoColumns: IColumn[] = [
  {
    key: 'label',
    name: 'Label',
  },
  {
    key: 'value',
    name: 'value',
    minWidth: 450,
  },
].map(
  (col): IColumn => ({
    isResizable: true,
    isCollapsable: false,
    minWidth: MIN_CELL_WIDTH,
    ariaLabel: col.name,
    fieldName: col.key,
    ...col,
  })
)
const Transaction = ({
  wallet: { id: walletID = '' },
  chain: { transaction = chainState.transaction },
  match,
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps<{ hash: string }>>) => {
  const [t] = useTranslation()

  useEffect(() => {
    dispatch({
      type: AppActions.CleanTransaction,
      payload: null,
    })
    updateTransaction({ walletID, hash: match.params.hash })(dispatch)
  }, [match.params.hash, dispatch, walletID])

  const basicInfoItems = useMemo(
    () => [
      { label: t('history.transaction-hash'), value: transaction.hash || 'none' },
      {
        label: t('history.date'),
        value: +(transaction.timestamp || transaction.createdAt)
          ? uniformTimeFormatter(+(transaction.timestamp || transaction.createdAt))
          : 'none',
      },
      {
        label: t('history.blockNumber'),
        value: localNumberFormatter(transaction.blockNumber) || 'none',
      },
      {
        label: t('history.amount'),
        value: transaction.value,
      },
    ],
    [t, transaction]
  )

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <Stack tokens={{ childrenGap: 15 }}>
        <Text variant="xLarge" as="h1">
          {t('history.basic-information')}
        </Text>
        <DetailsList
          columns={basicInfoColumns}
          items={basicInfoItems}
          layoutMode={DetailsListLayoutMode.justified}
          checkboxVisibility={CheckboxVisibility.hidden}
          compact
          isHeaderVisible={false}
        />
      </Stack>
      <Stack tokens={{ childrenGap: 15 }}>
        <Stack.Item>
          <Text variant="xLarge" as="h1">
            Inputs
          </Text>
          <DetailsList
            items={transaction.inputs}
            layoutMode={DetailsListLayoutMode.justified}
            columns={inputColumns}
            checkboxVisibility={CheckboxVisibility.hidden}
            compact
            isHeaderVisible
          />
        </Stack.Item>
        <Stack.Item>
          <Text variant="xLarge" as="h1">
            Outputs
          </Text>
          <DetailsList
            items={transaction.outputs.map((output, index) => ({ ...output, index }))}
            layoutMode={DetailsListLayoutMode.justified}
            columns={outputColumns}
            checkboxVisibility={CheckboxVisibility.hidden}
            compact
            isHeaderVisible
          />
        </Stack.Item>
      </Stack>
    </Stack>
  )
}

Transaction.displayName = 'Transaction'

export default Transaction
