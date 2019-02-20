import React from 'react'
import styled from 'styled-components'

type Variant = 'h1' | 'body1'
// TODO: | 'h2'
// TODO: | 'h3'
// TODO: | 'h4'
// TODO: | 'h5'
// TODO: | 'h6'
// TODO: | 'subtitle1'
// TODO: | 'subtitle2'
// TODO: | 'body2'
// TODO: | 'caption'
// TODO: | 'button'
// TODO: | 'overline'
// TODO: | 'srOnly'
// TODO: | 'inherit'
// TODO: | 'display4'
// TODO: | 'display3'
// TODO: | 'display2'
// TODO: | 'display1'
// TODO: | 'headline'
// TODO: | 'title'
// TODO: | 'subheading'
const H1 = styled.h1`
  user-select: none;
`

const Body1 = styled.span`
  user-select: none;
`
const Span = styled.span`
  user-select: none;
`

export default ({
  variant,
  children,
}: {
  variant?: Variant
  children?: React.ReactNode
}) => {
  switch (variant) {
    case 'h1': {
      return <H1>{children}</H1>
    }
    case 'body1': {
      return <Body1>{children}</Body1>
    }
    default: {
      return <Span>{children}</Span>
    }
  }
}
