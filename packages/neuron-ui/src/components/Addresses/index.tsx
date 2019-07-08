import React, { useEffect, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DetailsList, TextField, IColumn, DetailsListLayoutMode, CheckboxVisibility } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'

import { appCalls } from 'services/UILayer'

import { useLocalDescription } from 'utils/hooks'
import { MIN_CELL_WIDTH, Routes } from 'utils/const'

const Addresses = ({
  wallet: { id, addresses = [] },
  settings: { showAddressBook = false },
  dispatch,
  history,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
  useEffect(() => {
    if (!showAddressBook) {
      history.push(Routes.General)
    }
  }, [showAddressBook])

  const { localDescription, onDescriptionPress, onDescriptionFieldBlur, onDescriptionChange } = useLocalDescription(
    'address',
    id,
    useMemo(
      () =>
        addresses.map(({ address: key = '', description = '' }) => ({
          key,
          description,
        })),
      [addresses]
    ),
    dispatch
  )

  const addressColumns: IColumn[] = useMemo(
    () => [
      {
        name: 'addresses.type',
        key: 'type',
        fieldName: 'type',
        minWidth: MIN_CELL_WIDTH,
        maxWidth: 120,
        isResizable: true,
        isCollapsible: false,
        onRender: (item?: State.Address) => {
          if (undefined === item) return null
          return t(item.type === 0 ? 'addresses.receiving-address' : 'addresses.change-address')
        },
      },
      {
        name: 'addresses.address',
        key: 'address',
        fieldName: 'address',
        className: 'fixedWidth',
        minWidth: MIN_CELL_WIDTH,
        maxWidth: 450,
        isResizable: true,
        isCollapsible: false,
      },
      {
        name: 'addresses.description',
        key: 'description',
        fieldName: 'description',
        minWidth: MIN_CELL_WIDTH,
        maxWidth: 350,
        isResizable: true,
        isCollapsible: false,
        onRender: (item?: State.Address, idx?: number) => {
          return item && undefined !== idx ? (
            <TextField
              title={item.description}
              value={localDescription[idx] || ''}
              onKeyPress={onDescriptionPress(idx)}
              onBlur={onDescriptionFieldBlur(idx)}
              onChange={onDescriptionChange(idx)}
            />
          ) : null
        },
      },
      {
        name: 'addresses.balance',
        key: 'balance',
        fieldName: 'balance',
        minWidth: MIN_CELL_WIDTH,
        maxWidth: 250,
        isResizable: true,
        isCollapsible: false,
      },
      {
        name: 'addresses.transactions',
        key: 'transactions',
        fieldName: 'txCount',
        minWidth: MIN_CELL_WIDTH,
        maxWidth: 150,
        isResizable: true,
        isCollapsible: false,
      },
    ],
    [onDescriptionChange, localDescription, onDescriptionFieldBlur, onDescriptionPress, t]
  )

  return (
    <DetailsList
      checkboxVisibility={CheckboxVisibility.hidden}
      layoutMode={DetailsListLayoutMode.justified}
      columns={addressColumns.map(col => ({ ...col, name: t(col.name) }))}
      items={addresses}
      onItemContextMenu={item => {
        appCalls.contextMenu({ type: 'addressList', id: item.key })
      }}
    />
  )
}

Addresses.displayName = 'Addresses'

export default Addresses
