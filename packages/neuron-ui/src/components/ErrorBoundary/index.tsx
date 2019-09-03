import React, { Component } from 'react'
import { Stack, Spinner } from 'office-ui-fabric-react'
import { handleViewError } from 'services/remote'

const handleError = (error: Error) => {
  handleViewError(error.toString())
  window.location.reload()
  return { hasError: true }
}

class ErrorBoundary extends Component<{ children: React.ReactChild }, { hasError: boolean }> {
  /* eslint-disable react/state-in-constructor */
  state = {
    hasError: false,
  }

  static getDerivedStateFromError(error: Error) {
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
