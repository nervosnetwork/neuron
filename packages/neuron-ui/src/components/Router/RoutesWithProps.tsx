import React from 'react'
import { Route } from 'react-router-dom'
import { CustomRoute } from '.'

/**
 * @name RoutesWithProps
 * @description with this Component, props from parent will be passed to component in Route
 */
const RoutesWithProps = ({ contents, ...rest }: { contents: CustomRoute[] }) => (
  <>
    {contents.map(({ component: Component, ...restContent }) => {
      return (
        <Route
          key={restContent.name}
          {...restContent}
          render={(routeProps: any) => <Component {...routeProps} {...rest} />}
        />
      )
    })}
  </>
)

export default RoutesWithProps
