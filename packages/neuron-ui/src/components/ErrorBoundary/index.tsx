import React, { Component, ErrorInfo, ReactNode } from 'react'
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
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = {
      hasError: false,
    }
  }

  static getDerivedStateFromError(error: Error) {
    return handleError(error)
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    handleError(error, errorInfo)
    this.setState({ hasError: true })
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
