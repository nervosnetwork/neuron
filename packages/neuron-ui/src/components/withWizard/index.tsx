import React, { useReducer } from 'react'
import { Route, RouteComponentProps } from 'react-router-dom'
import { StateWithDispatch } from 'states/stateProvider/reducer'

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

export interface WizardElementProps<T = {}> extends RouteComponentProps<T> {
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
        render={(props: RouteComponentProps) => (
          <element.comp {...props} rootPath={rootPath} wallets={wallets} state={state} dispatch={dispatch} />
        )}
      />
    ))}
  </>
)

Wizard.displayName = 'Wizard'

const withWizard = (elements: Element[], initState: WithWizardState) => ({
  settings: { wallets = [] },
  match: { url: rootPath = '/wizard' },
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [state, dispatch] = useReducer(reducer, initState)

  return <Wizard rootPath={rootPath} state={state} wallets={wallets} dispatch={dispatch} elements={elements} />
}

export default withWizard
