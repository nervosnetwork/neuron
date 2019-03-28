import styled from 'styled-components'
import { Jumbotron } from 'react-bootstrap'

const Screen = styled(Jumbotron)<{ full: boolean }>`
  position: ${props => (props.full ? 'absolute' : 'relative')};
  right: ${props => (props.full ? 0 : 'auto')};
  bottom: ${props => (props.full ? 0 : 'auto')};
  width: ${props => (props.full ? '100%' : 'auto')};
  height: ${props => (props.full ? '100vh' : 'auto')};
  flex: 1;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`
export default Screen
