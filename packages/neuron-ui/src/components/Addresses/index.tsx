import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DetailsList, IColumn, DetailsListLayoutMode, CheckboxVisibility } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'

import { appCalls } from 'services/UILayer'

import { useLocalDescription } from 'utils/hooks'
import DescriptionField from 'widgets/InlineInput/DescriptionField'
import { MIN_CELL_WIDTH } from 'utils/const'

const addressColumns: IColumn[] = [
  {
    name: 'addresses.type',
    key: 'type',
    fieldName: 'type',
    minWidth: MIN_CELL_WIDTH,
    maxWidth: 120,
    isResizable: true,
    isCollapsible: false,
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
    fieldName: 'transactions',
    minWidth: MIN_CELL_WIDTH,
    maxWidth: 150,
    isResizable: true,
    isCollapsible: false,
  },
]

const Addresses = ({ dispatch, wallet: { addresses = [] } }: React.PropsWithoutRef<StateWithDispatch>) => {
  const [t] = useTranslation()

  const { localDescription, onDescriptionPress, onDescriptionFieldBlur, onDescriptionChange } = useLocalDescription(
    'address',
    useMemo(
      () =>
        addresses.map(({ address: key, description }) => ({
          key,
          description,
        })),
      [addresses]
    ),
    dispatch
  )

  const addressesItems = useMemo(
    () =>
      addresses.map(({ type, identifier, address, txCount, balance, description }, idx) => ({
        key: identifier,
        type: type === 0 ? t('addresses.receiving-address') : t('addresses.change-address'),
        address,
        identifier,
        description: (
          <DescriptionField
            type="text"
            title={description}
            value={localDescription[idx]}
            onKeyPress={onDescriptionPress(idx)}
            onBlur={onDescriptionFieldBlur(idx)}
            onChange={onDescriptionChange(idx)}
            maxLength={300}
          />
        ),
        balance,
        transactions: txCount,
      })),
    [addresses, onDescriptionChange, localDescription, onDescriptionFieldBlur, onDescriptionPress, t]
  )

  return (
    <DetailsList
      checkboxVisibility={CheckboxVisibility.hidden}
      layoutMode={DetailsListLayoutMode.justified}
      columns={addressColumns.map(col => ({ ...col, name: t(col.name) }))}
      items={addressesItems}
      onItemContextMenu={item => {
        appCalls.contextMenu({ type: 'addressList', id: item.key })
      }}
    />
  )
}

Addresses.displayName = 'Addresses'

export default Addresses
