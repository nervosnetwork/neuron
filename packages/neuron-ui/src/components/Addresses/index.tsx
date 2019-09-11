import React, { useEffect, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ShimmeredDetailsList,
  TextField,
  IColumn,
  CheckboxVisibility,
  IconButton,
  getTheme,
} from 'office-ui-fabric-react'

import { contextMenu } from 'services/remote'
import { StateWithDispatch } from 'states/stateProvider/reducer'

import { useLocalDescription } from 'utils/hooks'
import { Routes } from 'utils/const'
import { localNumberFormatter, shannonToCKBFormatter } from 'utils/formatters'
import { onRenderRow } from 'utils/fabricUIRender'

const Addresses = ({
  app: {
    loadings: { addressList: isLoading },
  },
  wallet: { addresses = [], id: walletID },
  settings: { showAddressBook = false },
  history,
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
  useEffect(() => {
    if (!showAddressBook) {
      history.push(Routes.Overview)
    }
  }, [showAddressBook, history])

  const {
    localDescription,
    onDescriptionPress,
    onDescriptionFieldBlur,
    onDescriptionChange,
    onDescriptionSelected,
  } = useLocalDescription('address', walletID, dispatch)

  const theme = getTheme()
  const { semanticColors } = theme

  const addressColumns: IColumn[] = useMemo(
    () => [
      {
        name: 'addresses.type',
        key: 'type',
        fieldName: 'type',
        minWidth: 150,
        maxWidth: 150,
        onRender: (item?: State.Address) => {
          if (undefined === item) {
            return null
          }
          if (item.type === 0) {
            return <span style={{ color: '#28b463' }}>{t('addresses.receiving-address')}</span>
          }
          return <span style={{ color: '#cccc00' }}>{t('addresses.change-address')}</span>
        },
      },
      {
        name: 'addresses.address',
        key: 'address',
        fieldName: 'address',
        className: 'monospacedFont',
        minWidth: 100,
        maxWidth: 500,
        onRender: (item?: State.Address) => {
          if (item) {
            return (
              <span className="textOverflow" title={item.address}>
                {item.address}
              </span>
            )
          }
          return '-'
        },
      },
      {
        name: 'addresses.description',
        key: 'description',
        fieldName: 'description',
        minWidth: 100,
        maxWidth: 300,
        onRender: (item?: State.Address) => {
          const isSelected = item && localDescription.key === item.address
          return item ? (
            <>
              <TextField
                borderless
                title={item.description}
                value={isSelected ? localDescription.description : item.description || ''}
                onBlur={isSelected ? onDescriptionFieldBlur(item.address, item.description) : undefined}
                onKeyPress={isSelected ? onDescriptionPress(item.address, item.description) : undefined}
                onChange={isSelected ? onDescriptionChange(item.address) : undefined}
                readOnly={!isSelected}
                styles={{
                  root: {
                    flex: 1,
                  },
                  fieldGroup: {
                    backgroundColor: isSelected ? '#fff' : 'transparent',
                    borderColor: 'transparent',
                    border: isSelected ? `1px solid ${semanticColors.inputBorder}!important` : 'none',
                  },
                }}
              />
              {isSelected ? null : (
                <IconButton
                  iconProps={{ iconName: 'Edit' }}
                  className="editButton"
                  onClick={onDescriptionSelected(item.address, item.description)}
                />
              )}
            </>
          ) : null
        },
      },
      {
        name: 'addresses.balance',
        key: 'balance',
        fieldName: 'balance',
        minWidth: 200,
        maxWidth: 250,
        onRender: (item?: State.Address) => {
          if (item) {
            return (
              <span title={`${item.balance} shannon`} className="textOverflow">
                {`${shannonToCKBFormatter(item.balance)} CKB`}
              </span>
            )
          }
          return '-'
        },
      },
      {
        name: 'addresses.transactions',
        key: 'transactions',
        fieldName: 'txCount',
        minWidth: 100,
        maxWidth: 200,
        onRender: (item?: State.Address) => {
          if (item) {
            return localNumberFormatter(item.txCount)
          }
          return '-'
        },
      },
    ],
    [
      onDescriptionChange,
      localDescription,
      onDescriptionFieldBlur,
      onDescriptionPress,
      onDescriptionSelected,
      t,
      semanticColors,
    ]
  )
  const List = useMemo(
    () => (
      <ShimmeredDetailsList
        enableShimmer={isLoading}
        checkboxVisibility={CheckboxVisibility.hidden}
        columns={addressColumns.map(col => ({ ...col, name: t(col.name) }))}
        items={addresses}
        onItemContextMenu={item => {
          contextMenu({ type: 'addressList', id: item.identifier })
        }}
        className="listWithDesc"
        onRenderRow={onRenderRow}
      />
    ),
    [isLoading, addressColumns, addresses, t]
  )

  return List
}

Addresses.displayName = 'Addresses'

export default Addresses
