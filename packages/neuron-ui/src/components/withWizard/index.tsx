import React, { useReducer } from 'react'
import { Route, RouteComponentProps } from 'react-router-dom'
import { useNeuronWallet } from 'utils/hooks'
import ScreenMessages from 'components/ScreenMessages'
import Screen from 'widgets/Screen'

export interface Element {
  path: string
  Component: React.SFC<any>
}

export interface WithWizardState {
  [key: string]: string
}

export interface WizardProps {
  state: WithWizardState
  messages: any
  elements: Element[]
  rootPath: string
  dispatch: React.Dispatch<any>
}

export interface WizardElementProps<T = {}> extends RouteComponentProps<T> {
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

const Wizard = ({ state, messages, elements, rootPath, dispatch }: WizardProps) => (
  <Screen>
    <ScreenMessages messages={messages} />
    {elements.map((element: any) => (
      <Route
        key={element.path}
        path={`${rootPath}${element.path || ''}${element.params || ''}`}
        render={(props: RouteComponentProps) => (
          <element.Component {...props} rootPath={rootPath} state={state} dispatch={dispatch} />
        )}
      />
    ))}
  </Screen>
)

Wizard.displayName = 'Wizard'

const withWizard = (elements: Element[], initState: WithWizardState) => ({ match }: RouteComponentProps) => {
  const { url: rootPath } = match
  const { messages } = useNeuronWallet()
  const [state, dispatch] = useReducer(reducer, initState)

  return <Wizard rootPath={rootPath} messages={messages} state={state} dispatch={dispatch} elements={elements} />
}

export default withWizard
