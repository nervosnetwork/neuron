import React from 'react'
import { Card, Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { MainActions, actionCreators } from 'containers/MainContent/reducer'
import { Network } from 'contexts/NeuronWallet'
import { UnremovableNetwork } from 'utils/const'

const RemoveNetworkDialog = ({
  isChecked,
  network,
  dispatch,
}: {
  isChecked: boolean
  network?: Network
  dispatch: any
}) => {
  const [t] = useTranslation()
  return (
    <Card
      onClick={(e: React.SyntheticEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {network ? (
        <>
          <Card.Header>{`${t('Remove Address')}: ${network.name || network.remote}`}</Card.Header>
          <Card.Body>
            {`Network of name: ${network.name}, address: ${network.remote} will be removed.`}
            {isChecked ? (
              <p>{`It's the active network, removing it will make reconnect to ${UnremovableNetwork}`}</p>
            ) : null}
          </Card.Body>
          <Card.Footer className="text-muted">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Button
                variant="danger"
                onClick={() => {
                  dispatch(actionCreators.deleteNetwork(network.id))
                }}
              >
                {t('Confirm')}
              </Button>
              <Button
                variant="light"
                onClick={() =>
                  dispatch({
                    type: MainActions.SetDialog,
                    payload: {
                      open: false,
                    },
                  })
                }
              >
                {t('Cancel')}
              </Button>
            </div>
          </Card.Footer>
        </>
      ) : (
        <div>Network not found</div>
      )}
    </Card>
  )
}

RemoveNetworkDialog.displayName = 'RemoveNetworkDialog'
export default RemoveNetworkDialog
