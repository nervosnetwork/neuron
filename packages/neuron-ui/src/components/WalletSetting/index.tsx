import React from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { Col, Row, ListGroup, Form, Container } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import styled from 'styled-components'

import { appCalls } from 'services/UILayer'
import { Routes, MnemonicAction } from 'utils/const'
import { WalletWizardPath } from 'components/WalletWizard'
import { useNeuronWallet } from 'utils/hooks'
import { ContentProps } from 'containers/MainContent'
import { actionCreators } from 'containers/MainContent/reducer'

import ListGroupWithMaxHeight from 'widgets/ListGroupWithMaxHeight'

const CheckBox = styled(Form.Check)`
  pointer-events: none;
  input {
    pointer-events: auto;
  }
`

const buttons = [
  {
    label: 'wizard.create-new-wallet',
    href: `${Routes.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}`,
  },
  {
    label: 'wizard.import-wallet',
    href: `${Routes.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}`,
  },
]

const Wallets = ({ dispatch }: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const {
    wallet: { id: activeId },
    settings: { wallets },
  } = useNeuronWallet()

  const [t] = useTranslation()

  return (
    <>
      <ListGroupWithMaxHeight>
        {wallets.map(wallet => {
          const isChecked = wallet.id === activeId
          return (
            <ListGroup.Item
              key={wallet.id}
              onContextMenu={() => appCalls.contextMenu({ type: 'walletList', id: wallet.id })}
            >
              <CheckBox
                inline
                label={wallet.name}
                type="radio"
                checked={isChecked}
                disabled={isChecked}
                onChange={() => {
                  dispatch(actionCreators.activateWallet(wallet.id))
                }}
              />
            </ListGroup.Item>
          )
        })}
      </ListGroupWithMaxHeight>
      <Container>
        <Row>
          {buttons.map(({ label, href }) => (
            <Col key={label}>
              <Link className="btn btn-primary" to={href}>
                {t(label)}
              </Link>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  )
}

export default Wallets
