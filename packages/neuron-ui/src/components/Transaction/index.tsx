import React, { useEffect, useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Card, Alert, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { ContentProps } from '../../containers/MainContent'
import { actionCreators, MainActions } from '../../containers/MainContent/reducer'
import { ProviderActions } from '../../containers/Providers/reducer'
import { useNeuronWallet } from '../../utils/hooks'

// import ChainContext from '../../contexts/Chain'

const Transaction = (props: React.PropsWithoutRef<ContentProps & RouteComponentProps<{ hash: string }>>) => {
  const { match, errorMsgs, dispatch, providerDispatch, history } = props
  const [t] = useTranslation()
  const {
    chain: { transaction },
  } = useNeuronWallet()

  useEffect(() => {
    // TODO: verify hash
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
  }, [match.params.hash])

  const goBack = useCallback(() => {
    history.goBack()
  }, [])

  return (
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
          <b>{`${t('history.date')}: `}</b>
          {new Date(transaction.date).toLocaleString()}
        </Card.Text>
      </Card.Body>
      <Card.Footer>
        <Button variant="primary" onClick={goBack} onKeyPress={goBack}>
          {t('transaction.goBack')}
        </Button>
      </Card.Footer>
    </Card>
  )
}

Transaction.displayName = 'Transaction'
export default Transaction
