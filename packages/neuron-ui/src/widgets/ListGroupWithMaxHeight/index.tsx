import styled from 'styled-components'
import { ListGroup } from 'react-bootstrap'

const ListGroupWithMaxHeight = styled(ListGroup)`
  max-height: calc(100vh - 300px);
  overflow-y: scroll;
  margin-bottom: 50px;
  scroll-behavior: smooth;
  scroll-snap-type: y mandatory;
  & > div {
    display: flex;
    justify-content: space-between;
    min-height: 48px;
    scroll-snap-align: start;
  }
`

ListGroupWithMaxHeight.displayName = 'ListGroupWithMaxHeight'

export default ListGroupWithMaxHeight
