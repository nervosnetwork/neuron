import styled from 'styled-components'

const RightScreenButtonRow = styled.div`
  display: flex;
  padding-top: 30px;
  justify-content: flex-end;

  button {
    margin-left: 20px;
  }
`

const LeftScreenButtonRow = styled.div`
  display: flex;
  padding-top: 30px;
  justify-content: flex-start;

  button {
    margin-right: 20px;
  }
`

export { RightScreenButtonRow, LeftScreenButtonRow }

export default styled.div`
  display: flex;
  padding-top: 30px;
  justify-content: space-between;
`
