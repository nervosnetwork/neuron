import React, { Component, ErrorInfo } from 'react'
import { Stack } from 'office-ui-fabric-react'
import Spinner from 'widgets/Spinner'
import { handleViewError } from 'services/remote'

const handleError = (error: Error, errorInfo?: ErrorInfo) => {
  handleViewError(
    JSON.stringify([
      `UI crash: ${error.message}`,
      {
        stack: error.stack,
        componentStack: errorInfo?.componentStack || 'N/A',
      },
    ])
  )
  if (import.meta.env.MODE !== 'development') {
    window.location.reload()
  }
  return { hasError: true }
}

class ErrorBoundary extends Component<{ children: React.ReactChild }, { hasError: boolean }> {
  constructor(props: { children: React.ReactChild }) {
    super(props)
    this.state = {
      hasError: false,
    }
  }

  static getDerivedStateFromError(error: Error) {
    return handleError(error)
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState(handleError(error, errorInfo))
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
