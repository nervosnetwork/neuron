import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { appCalls } from 'services/UILayer'
import { useLocalDescription } from 'utils/hooks'
import { Text, DetailsList, TextField, IColumn, IGroup, CheckboxVisibility } from 'office-ui-fabric-react'
import { StateDispatch } from 'states/stateProvider/reducer'

const timeFormatter = new Intl.DateTimeFormat('en-GB')

const MIN_CELL_WIDTH = 70

interface FormatTransaction extends State.Transaction {
  date: string
}

const onRenderHeader = ({ group }: any) => {
  const { name } = group
  return <Text variant="large">{name}</Text>
}

const TransactionList = ({ items, dispatch }: { items: State.Transaction[]; dispatch: StateDispatch }) => {
  const [t] = useTranslation()

  const { localDescription, onDescriptionPress, onDescriptionFieldBlur, onDescriptionChange } = useLocalDescription(
    'transaction',
    items.map(({ hash: key, description = '' }) => ({
      key,
      description,
    })),
    dispatch
  )
  const transactionColumns: IColumn[] = useMemo(
    (): IColumn[] => [
      { name: t('history.type'), key: 'type', fieldName: 'type', minWidth: MIN_CELL_WIDTH, maxWidth: 150 },
      {
        name: t('history.timestamp'),
        key: 'timestamp',
        fieldName: 'timestamp',
        minWidth: MIN_CELL_WIDTH,
        maxWidth: 150,
        onRender: (item?: FormatTransaction) => {
          return item ? <span>{new Date(+item.timestamp).toLocaleTimeString()}</span> : null
        },
      },
      { name: t('history.transaction-hash'), key: 'hash', fieldName: 'hash', minWidth: MIN_CELL_WIDTH, maxWidth: 200 },
      { name: t('history.status'), key: 'status', fieldName: 'status', minWidth: MIN_CELL_WIDTH, maxWidth: 50 },
      {
        name: t('history.description'),
        key: 'description',
        fieldName: 'description',
        minWidth: MIN_CELL_WIDTH,
        maxWidth: 200,
        onRender: (item?: FormatTransaction, idx?: number) => {
          return item && undefined !== idx ? (
            <TextField
              title={item.description}
              value={localDescription[idx]}
              onKeyPress={onDescriptionPress(idx)}
              onBlur={onDescriptionFieldBlur(idx)}
              onChange={onDescriptionChange(idx)}
            />
          ) : null
        },
      },
      { name: t('history.amount'), key: 'value', fieldName: 'value', minWidth: MIN_CELL_WIDTH, maxWidth: 300 },
    ],
    [localDescription, onDescriptionChange, onDescriptionFieldBlur, onDescriptionPress, t]
  )
  const { groups, txs } = useMemo(() => {
    const gs: IGroup[] = [
      {
        key: 'pending',
        name: 'pending',
        startIndex: 0,
        count: 0,
      },
    ]
    const ts = items
      .sort((item1, item2) => +item2.timestamp - +item1.timestamp)
      .map(item => {
        if (item.status === 'pending') {
          gs[0].count++
        }
        const date = timeFormatter.format(+item.timestamp)
        if (date !== gs[gs.length - 1].key) {
          gs.push({
            key: date,
            name: date,
            startIndex: gs[gs.length - 1].count + gs[gs.length - 1].startIndex,
            count: 1,
          })
        } else {
          gs[gs.length - 1].count++
        }
        return { ...item, date }
      })
    return { groups: gs, txs: ts }
  }, [items])

  return (
    <DetailsList
      columns={transactionColumns}
      items={txs}
      groups={groups}
      groupProps={{
        onRenderHeader,
      }}
      checkboxVisibility={CheckboxVisibility.hidden}
      onItemContextMenu={item => {
        if (item) {
          appCalls.contextMenu({ type: 'transactionList', id: item.hash })
        }
      }}
    />
  )
}

TransactionList.displayName = 'TransactionList'

export default TransactionList
