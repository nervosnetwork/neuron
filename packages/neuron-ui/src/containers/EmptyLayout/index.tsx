import React from 'react'
import styled from 'styled-components'

const DefaultLayoutDiv = styled.div`
  width: 100vw;
  height: 100vh;
`
export default (Comp: React.ComponentType) => (props: React.Props<any>) => (
  <DefaultLayoutDiv>
    <Comp {...props} />
  </DefaultLayoutDiv>
)
