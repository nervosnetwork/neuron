import React, { useEffect, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  DetailsList,
  TextField,
  IColumn,
  DetailsListLayoutMode,
  CheckboxVisibility,
  ITextFieldStyleProps,
  getTheme,
} from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'

import { appCalls } from 'services/UILayer'

import { useLocalDescription } from 'utils/hooks'
import { MIN_CELL_WIDTH, Routes } from 'utils/const'
import { shannonToCKBFormatter } from 'utils/formatters'

const Addresses = ({
  wallet: { id, addresses = [] },
  settings: { showAddressBook = false },
  dispatch,
  history,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
  useEffect(() => {
    if (!showAddressBook) {
      history.push(Routes.Overview)
    }
  }, [showAddressBook, history])

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

  const theme = getTheme()
  const { semanticColors } = theme

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
        className: 'fixedWidth',
        minWidth: MIN_CELL_WIDTH,
        maxWidth: 450,
        isResizable: true,
        isCollapsible: false,
        onRender: (item?: State.Address) => {
          if (item) {
            return (
              <span className="text-overflow" title={item.address}>
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
        minWidth: MIN_CELL_WIDTH,
        maxWidth: 350,
        isResizable: true,
        isCollapsible: false,
        onRender: (item?: State.Address, idx?: number) => {
          return item && undefined !== idx ? (
            <TextField
              borderless
              title={item.description}
              value={localDescription[idx] || ''}
              onKeyPress={onDescriptionPress(idx)}
              onBlur={onDescriptionFieldBlur(idx)}
              onChange={onDescriptionChange(idx)}
              styles={(props: ITextFieldStyleProps) => {
                return {
                  root: {
                    flex: 1,
                  },
                  fieldGroup: {
                    borderColor: props.focused ? semanticColors.inputBorder : 'transparent',
                    border: '1px solid',
                  },
                }
              }}
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
        onRender: (item?: State.Address) => {
          if (item) {
            return (
              <span title={`${item.balance} shannon`} className="text-overflow">
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
        minWidth: MIN_CELL_WIDTH,
        maxWidth: 150,
        isResizable: true,
        isCollapsible: false,
        onRender: (item?: State.Address) => {
          if (item) {
            return (+item.txCount).toLocaleString()
          }
          return '-'
        },
      },
    ],
    [onDescriptionChange, localDescription, onDescriptionFieldBlur, onDescriptionPress, t, semanticColors]
  )

  return (
    <DetailsList
      checkboxVisibility={CheckboxVisibility.hidden}
      layoutMode={DetailsListLayoutMode.justified}
      columns={addressColumns.map(col => ({ ...col, name: t(col.name) }))}
      items={addresses}
      onItemContextMenu={item => {
        appCalls.contextMenu({ type: 'addressList', id: item.identifier })
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

Addresses.displayName = 'Addresses'

export default Addresses
