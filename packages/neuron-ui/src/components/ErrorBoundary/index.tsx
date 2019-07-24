import React, { Component } from 'react'
import { appCalls } from 'services/UILayer'
import { Stack, Spinner } from 'office-ui-fabric-react'

const handleError = (error: Error) => {
  appCalls.handleViewError(error.toString())
  setTimeout(() => {
    window.location.reload()
  }, 0)
  return { hasError: true }
}

class ErrorBoundary extends Component<{ children: React.ReactChild }, { hasError: boolean }> {
  state = {
    hasError: false,
  }

  static getDerivedStateFromError(error: Error) {
    window.alert(error.stack)
    return handleError(error)
  }

  public componentDidCatch(error: Error) {
    this.setState(handleError(error))
  }

  render() {
    const { hasError } = this.state
    const { children } = this.props
    return hasError ? (
      <Stack verticalFill verticalAlign="center">
        <Spinner />
      </Stack>
    ) : (
      children
    )
  }
}

export default ErrorBoundary
