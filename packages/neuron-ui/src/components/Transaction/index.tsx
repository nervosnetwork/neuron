import React, { useEffect, useContext } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Alert } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { ContentProps } from '../../containers/MainContent'
import { actionCreators, MainActions } from '../../containers/MainContent/reducer'

import ChainContext from '../../contexts/Chain'

const Transaction = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ hash: string }>>) => {
  const { match, errorMsgs, dispatch } = props
  const chain = useContext(ChainContext)
  const [t] = useTranslation()
  const { transaction } = chain

  useEffect(() => {
    // TODO: verify hash
    dispatch(actionCreators.getTransaction(match.params.hash))
    return () => {
      dispatch({
        type: MainActions.ErrorMessage,
        payload: {
          transaction: '',
        },
      })
    }
  }, [match.params.hash])

  const loading = match.params.hash !== transaction.hash
  return (
    <Card>
      <Card.Header>
        <Card.Text>
          <b>{`${t('history.transaction-hash')}: `}</b>
          {loading ? 'Loading' : transaction.hash}
        </Card.Text>
      </Card.Header>
      <Card.Body>
        {errorMsgs.transaction ? <Alert variant="warning">{t(`messages.${errorMsgs.transaction}`)}</Alert> : null}
        <Card.Text>
          <b>{`${t('history.amount')}: `}</b>
          {loading ? 'Loading' : transaction.value}
        </Card.Text>
      </Card.Body>
      <Card.Footer>
        <Card.Text>
          <b>{`${t('history.date')}: `}</b>
          {loading ? 'Loading' : new Date(transaction.date).toLocaleString()}
        </Card.Text>
      </Card.Footer>
    </Card>
  )
}

Transaction.displayName = 'Transaction'
export default Transaction
