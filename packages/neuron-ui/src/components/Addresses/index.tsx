import React, { useEffect, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ShimmeredDetailsList,
  TextField,
  IColumn,
  CheckboxVisibility,
  ITextFieldStyleProps,
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
    loadings: { addressList: isLoading, updateDescription: isUpdatingDescription },
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
    onDescriptionFocus,
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
        className: 'fixedWidth',
        minWidth: 100,
        maxWidth: 400,
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
        minWidth: 100,
        maxWidth: 300,
        onRender: (item?: State.Address) => {
          return item ? (
            <TextField
              borderless
              title={item.description}
              value={localDescription.key === item.address ? localDescription.description : item.description || ''}
              onBlur={onDescriptionFieldBlur(item.address, item.description)}
              onFocus={onDescriptionFocus}
              onKeyPress={onDescriptionPress(item.address, item.description)}
              onChange={onDescriptionChange(item.address)}
              disabled={localDescription.key === item.address && isUpdatingDescription}
              iconProps={{
                iconName: localDescription.key === item.address && isUpdatingDescription ? 'Updating' : '',
              }}
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
        minWidth: 200,
        maxWidth: 400,
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
      onDescriptionFocus,
      isUpdatingDescription,
      t,
      semanticColors,
    ]
  )

  return (
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
  )
}

Addresses.displayName = 'Addresses'

export default Addresses
