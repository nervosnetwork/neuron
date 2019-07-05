import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { appCalls } from 'services/UILayer'
import { useLocalDescription } from 'utils/hooks'

import DescriptionField from 'widgets/InlineInput/DescriptionField'
import { DetailsList, IColumn, DetailsListLayoutMode, CheckboxVisibility } from 'office-ui-fabric-react'
import { StateWithDispatch } from 'states/stateProvider/reducer'

const MIN_CELL_WIDTH = 100

const addressColumns: IColumn[] = [
  {
    name: 'addresses.type',
    key: 'type',
    fieldName: 'type',
    isResizable: true,
    minWidth: MIN_CELL_WIDTH,
    maxWidth: 120,
  },
  {
    name: 'addresses.address',
    key: 'address',
    fieldName: 'address',
    className: 'fixedWidth',
    isResizable: true,
    isCollapsible: false,
    minWidth: MIN_CELL_WIDTH,
    maxWidth: 450,
  },
  {
    name: 'addresses.description',
    key: 'description',
    fieldName: 'description',
    isResizable: true,
    minWidth: MIN_CELL_WIDTH,
    maxWidth: 350,
  },
  {
    name: 'addresses.balance',
    key: 'balance',
    fieldName: 'balance',
    isResizable: true,
    minWidth: MIN_CELL_WIDTH,
    maxWidth: 250,
  },
  {
    name: 'addresses.transactions',
    key: 'transactions',
    fieldName: 'transactions',
    minWidth: MIN_CELL_WIDTH,
    maxWidth: 150,
    isResizable: true,
  },
]

const Addresses = ({ dispatch, wallet: { addresses } }: React.PropsWithoutRef<StateWithDispatch>) => {
  const [t] = useTranslation()

  const { localDescription, onDescriptionPress, onDescriptionFieldBlur, onDescriptionChange } = useLocalDescription(
    'address',
    addresses.map(({ address: key, description }) => ({
      key,
      description,
    })),
    dispatch
  )

  const addressesItems = useMemo(
    () =>
      addresses.map(({ type, identifier, address, txCount, balance, description }, idx) => ({
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
        key: identifier,
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

export default Addresses
