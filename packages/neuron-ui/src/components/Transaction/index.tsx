import React, { useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Alert, Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { ContentProps } from 'containers/MainContent'
import { actionCreators, MainActions } from 'containers/MainContent/reducer'
import { ProviderActions } from 'containers/Providers/reducer'
import Screen from 'widgets/Screen'

import { useNeuronWallet } from 'utils/hooks'
import { localNumberFormatter } from 'utils/formatters'

const Transaction = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ hash: string }>>) => {
  const { match, errorMsgs, dispatch, providerDispatch } = props
  const [t] = useTranslation()
  const {
    chain: { transaction },
  } = useNeuronWallet()

  useEffect(() => {
    dispatch(actionCreators.getTransaction(match.params.hash))
    return () => {
      providerDispatch({
        type: ProviderActions.CleanTransaction,
      })
      dispatch({
        type: MainActions.ErrorMessage,
        payload: {
          transaction: '',
        },
      })
    }
  }, [match.params.hash, dispatch, providerDispatch])

  return (
    <Screen>
      <Card>
        <Card.Header>
          <Card.Text>
            <b>{`${t('history.transaction-hash')}: `}</b>
            {transaction.hash}
          </Card.Text>
        </Card.Header>
        <Card.Body>
          {errorMsgs.transaction ? <Alert variant="warning">{t(`messages.${errorMsgs.transaction}`)}</Alert> : null}
          <Card.Text>
            <b>{`${t('history.amount')}: `}</b>
            {transaction.value}
          </Card.Text>
          <Card.Text>
            <div>
              <b>{`${t('history.date')}: `}</b>
              {transaction.timestamp ? new Date(+transaction.timestamp).toLocaleString() : null}
            </div>
            <div>
              <b>{`${t('history.blockNumber')}: `}</b>
              {localNumberFormatter(transaction.blockNumber)}
            </div>
            <div>
              <b>{`${t('history.amount')}: `}</b>
              {transaction.value}
            </div>
            <div>
              <b>Inputs</b>
              <Table>
                <thead>
                  <tr>
                    <th>Lock Hash</th>
                    <th>OutPoint Block Hash</th>
                    <th>OutPoint Cell</th>
                    <th>Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.inputs.map(input => (
                    <tr key={JSON.stringify(input.previousOutput)}>
                      <td>{input.lockHash}</td>
                      <td>{input.previousOutput.blockHash || 'none'}</td>
                      <td>
                        {input.previousOutput.cell
                          ? `${input.previousOutput.cell.txHash}[${input.previousOutput.cell.index}]`
                          : 'none'}
                      </td>
                      <td>{input.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div>
              <b>Outputs</b>
              <Table>
                <thead>
                  <tr>
                    <th>Index</th>
                    <th>Lock Hash</th>
                    <th>Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.outputs.map((output, index) => (
                    <tr key={`${JSON.stringify(output.outPoint)}`}>
                      <td>{index}</td>
                      <td>{output.lockHash}</td>
                      <td>{output.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Text>
        </Card.Body>
      </Card>
    </Screen>
  )
}

Transaction.displayName = 'Transaction'

export default Transaction
