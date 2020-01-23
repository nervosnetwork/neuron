import React, { useReducer } from 'react'
import { Route } from 'react-router-dom'
import { useState as useGlobalState } from 'states/stateProvider'

export interface Element {
  path: string
  comp: React.SFC<any>
}

export interface WithWizardState {
  [key: string]: string
}

export interface WizardProps {
  state: WithWizardState
  elements: Element[]
  wallets: Readonly<State.WalletIdentity[]>
  rootPath: string
  dispatch: React.Dispatch<any>
}

export interface WizardElementProps {
  wallets: State.Wallet[]
  rootPath: string
  state: WithWizardState
  dispatch: React.Dispatch<any>
}

const reducer = (
  state: { [key: string]: string },
  {
    type,
    payload,
  }: {
    type: string
    payload: string
  }
) => {
  switch (type) {
    default: {
      return { ...state, [type]: payload }
    }
  }
}

const Wizard = ({ state, elements, wallets, rootPath, dispatch }: WizardProps) => (
  <>
    {elements.map((element: any) => (
      <Route
        key={element.path}
        path={`${rootPath}${element.path || ''}${element.params || ''}`}
        render={() => <element.comp rootPath={rootPath} wallets={wallets} state={state} dispatch={dispatch} />}
      />
    ))}
  </>
)

Wizard.displayName = 'Wizard'

const withWizard = (elements: Element[], initState: WithWizardState) => () => {
  const {
    settings: { wallets = [] },
  } = useGlobalState()
  const [state, dispatch] = useReducer(reducer, initState)

  return <Wizard rootPath="/wizard" state={state} wallets={wallets} dispatch={dispatch} elements={elements} />
}

export default withWizard
