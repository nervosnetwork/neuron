import React, { useState, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Stack,
  ShimmeredDetailsList,
  TextField,
  IColumn,
  CheckboxVisibility,
  DefaultButton,
  IconButton,
  Text,
  getTheme,
} from 'office-ui-fabric-react'

import { contextMenu } from 'services/remote'
import { ckbCore } from 'services/chain'
import { StateWithDispatch } from 'states/stateProvider/reducer'

import { useLocalDescription } from 'utils/hooks'
import { localNumberFormatter, shannonToCKBFormatter } from 'utils/formatters'
import { onRenderRow } from 'utils/fabricUIRender'

const Addresses = ({
  app: {
    loadings: { addressList: isLoading },
  },
  wallet: { addresses = [], id: walletID },
  chain: { networkID },
  settings: { networks = [] },
  dispatch,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const isMainnet =
    (networks.find(n => n.id === networkID) || {}).chain === (process.env.REACT_APP_MAINNET_TAG || 'ckb')
  const [showMainnetAddress, setShowMainnetAddress] = useState(false)
  const [t] = useTranslation()

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
        onRender: (item?: State.Address, _index?: number, column?: IColumn) => {
          if (item) {
            if (column && (column.calculatedWidth || 0) < 420) {
              return (
                <div
                  title={item.address}
                  style={{
                    overflow: 'hidden',
                    display: 'flex',
                  }}
                >
                  <span className="textOverflow">{item.address.slice(0, -6)}</span>
                  <span>{item.address.slice(-6)}</span>
                </div>
              )
            }
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
        onRender: (item?: State.Address) => {
          const isSelected = item && localDescription.key === item.address
          return item ? (
            <>
              <TextField
                data-description-key={item.address}
                data-description-value={item.description}
                borderless
                title={item.description}
                value={isSelected ? localDescription.description : item.description || ''}
                onBlur={isSelected ? onDescriptionFieldBlur : undefined}
                onKeyPress={isSelected ? onDescriptionPress : undefined}
                onChange={isSelected ? onDescriptionChange : undefined}
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
        columns={addressColumns
          .filter(col => !showMainnetAddress || col.key === 'address')
          .map(col => ({ ...col, name: t(col.name) }))}
        items={addresses.map(addr => ({
          ...addr,
          address: showMainnetAddress
            ? ckbCore.utils.bech32Address(addr.identifier, {
                prefix: ckbCore.utils.AddressPrefix.Mainnet,
                type: ckbCore.utils.AddressType.HashIdx,
                codeHashOrCodeHashIndex: '0x00',
              }) || ''
            : addr.address,
        }))}
        onItemContextMenu={item => {
          if (showMainnetAddress) {
            contextMenu({ type: 'copyMainnetAddress', id: item.identifier })
          } else {
            contextMenu({ type: 'addressList', id: item.identifier })
          }
        }}
        className="listWithDesc"
        onRenderRow={onRenderRow}
      />
    ),
    [isLoading, addressColumns, addresses, showMainnetAddress, t]
  )

  return (
    <>
      <Stack verticalAlign="center" horizontalAlign="start" tokens={{ childrenGap: 15 }}>
        {!isMainnet ? (
          <DefaultButton
            text={t(`addresses.display-${showMainnetAddress ? 'testnet' : 'mainnet'}-addresses`)}
            onClick={() => setShowMainnetAddress(!showMainnetAddress)}
          />
        ) : null}
        {showMainnetAddress && !isMainnet ? (
          <Text variant="medium" style={{ color: semanticColors.errorText }}>
            {t('addresses.mainnet-address-caution')}
          </Text>
        ) : null}
      </Stack>
      {List}
    </>
  )
}

Addresses.displayName = 'Addresses'

export default Addresses
