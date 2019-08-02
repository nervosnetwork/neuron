import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Stack, DetailsList, Text, DetailsListLayoutMode, CheckboxVisibility, IColumn } from 'office-ui-fabric-react'
import { currentWallet as currentWalletCache } from 'utils/localCache'
import { getTransaction } from 'services/remote'

import { transactionState } from 'states/initStates/chain'

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
    minWidth: 100,
    maxWidth: 150,
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
const Transaction = () => {
  const [t] = useTranslation()
  const [transaction, setTransaction] = useState(transactionState)
  const [error, setError] = useState({ code: '', message: '' })
  useEffect(() => {
    const currentWallet = currentWalletCache.load()
    if (currentWallet) {
      const hash = window.location.href.split('/').pop()
      getTransaction({ hash, walletID: currentWallet.id })
        .then(res => {
          if (res.status) {
            setTransaction(res.result)
          } else {
            throw new Error(res.message.title)
          }
        })
        .catch((err: Error) => {
          setError({
            code: '-1',
            message: err.message,
          })
        })
    }
  }, [])

  useEffect(() => {
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'currentWallet') {
        window.close()
      }
    })
  }, [])

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

  if (error.code) {
    return (
      <Stack verticalFill verticalAlign="center" horizontalAlign="center">
        {error.message || t('messages.transaction-not-found')}
      </Stack>
    )
  }

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
