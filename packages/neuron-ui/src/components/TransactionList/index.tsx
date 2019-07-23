import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Stack,
  Text,
  DetailsList,
  TextField,
  IColumn,
  IGroup,
  CheckboxVisibility,
  ITextFieldStyleProps,
  getTheme,
} from 'office-ui-fabric-react'

import { StateDispatch } from 'states/stateProvider/reducer'

import { appCalls } from 'services/UILayer'
import { useLocalDescription } from 'utils/hooks'
import { shannonToCKBFormatter, uniformTimeFormatter as timeFormatter, uniformTimeFormatter } from 'utils/formatters'

const theme = getTheme()

const MIN_CELL_WIDTH = 50

interface FormatTransaction extends State.Transaction {
  date: string
}

const onRenderHeader = ({ group }: any) => {
  const { name } = group
  return (
    <Stack
      tokens={{ padding: 15 }}
      styles={{
        root: {
          background: theme.palette.neutralLighterAlt,
          borderTop: `1px solid ${theme.palette.neutralSecondary}`,
          borderBottom: `1px solid ${theme.palette.neutralLighter}`,
        },
      }}
    >
      <Text variant="large">{name}</Text>
    </Stack>
  )
}

const TransactionList = ({
  walletID,
  items = [],
  dispatch,
}: {
  walletID: string
  items: State.Transaction[]
  dispatch: StateDispatch
}) => {
  const [t] = useTranslation()

  const { localDescription, onDescriptionPress, onDescriptionFieldBlur, onDescriptionChange } = useLocalDescription(
    'transaction',
    walletID,
    useMemo(
      () =>
        items.map(({ hash: key, description = '' }) => ({
          key,
          description,
        })),
      [items]
    ),
    dispatch
  )

  const transactionColumns: IColumn[] = useMemo(
    (): IColumn[] =>
      [
        { name: t('history.type'), key: 'type', fieldName: 'type', minWidth: MIN_CELL_WIDTH, maxWidth: 50 },
        {
          name: t('history.timestamp'),
          key: 'timestamp',
          fieldName: 'timestamp',
          minWidth: 80,
          maxWidth: 80,
          onRender: (item?: FormatTransaction) => {
            return item ? <span>{uniformTimeFormatter(item.timestamp || item.createdAt).split(' ')[1]}</span> : null
          },
        },
        {
          name: t('history.transaction-hash'),
          key: 'hash',
          fieldName: 'hash',
          minWidth: 100,
          maxWidth: 600,
          onRender: (item?: FormatTransaction) => {
            if (item) {
              return (
                <span className="text-overflow fixedWidth" title={item.hash}>
                  {item.hash}
                </span>
              )
            }
            return '-'
          },
        },
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
                value={localDescription[idx] || ''}
                onKeyPress={onDescriptionPress(idx)}
                onBlur={onDescriptionFieldBlur(idx)}
                onChange={onDescriptionChange(idx)}
                borderless
                styles={(props: ITextFieldStyleProps) => {
                  return {
                    fieldGroup: {
                      borderColor: '#ccc',
                      border: props.focused ? '1px solid' : 'none',
                    },
                  }
                }}
              />
            ) : null
          },
        },
        {
          name: t('history.amount'),
          key: 'value',
          fieldName: 'value',
          minWidth: 100,
          maxWidth: 300,
          onRender: (item?: FormatTransaction) => {
            if (item) {
              return (
                <span title={`${item.value} shannon`} className="text-overflow">
                  {`${shannonToCKBFormatter(item.value)} CKB`}
                </span>
              )
            }
            return '-'
          },
        },
      ].map(
        (col): IColumn => ({ fieldName: col.key, ariaLabel: col.name, isResizable: true, isCollapsable: false, ...col })
      ),
    [localDescription, onDescriptionChange, onDescriptionFieldBlur, onDescriptionPress, t]
  )

  const { groups, txs } = useMemo(() => {
    const groupItems: IGroup[] = [
      {
        key: 'pending',
        name: 'Pending',
        startIndex: 0,
        count: 0,
      },
    ]
    const txItems = items.map(item => {
      const date = timeFormatter(+(item.timestamp || item.createdAt)).split(' ')[0]
      if (item.status === 'pending') {
        groupItems[0].count++
        return { ...item, date }
      }

      if (date !== groupItems[groupItems.length - 1].key) {
        groupItems.push({
          key: date,
          name: date,
          startIndex: groupItems[groupItems.length - 1].count + groupItems[groupItems.length - 1].startIndex,
          count: 1,
        })
      } else {
        groupItems[groupItems.length - 1].count++
      }
      return { ...item, date }
    })
    return { groups: groupItems, txs: txItems }
  }, [items])

  return (
    <DetailsList
      columns={transactionColumns}
      items={txs}
      groups={groups.filter(group => group.count !== 0)}
      groupProps={{
        onRenderHeader,
      }}
      checkboxVisibility={CheckboxVisibility.hidden}
      onItemContextMenu={item => {
        if (item) {
          appCalls.contextMenu({ type: 'transactionList', id: item.hash })
        }
      }}
      styles={{
        contentWrapper: {
          selectors: {
            '.ms-DetailsRow-cell': {
              display: 'flex',
              alignItems: 'center',
            },
            '.text-overflow': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          },
        },
      }}
    />
  )
}

TransactionList.displayName = 'TransactionList'

export default TransactionList
