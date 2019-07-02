import styled from 'styled-components'

type Mode = 'fullscreen' | 'responsive'
const Screen = styled('div')<{ mode: Mode }>`
  position: ${({ mode = 'fullscreen' }) => (mode === 'fullscreen' ? 'absolute' : 'relative')};
  right: ${({ mode = 'fullscreen' }) => (mode === 'fullscreen' ? 0 : 'auto')};
  bottom: ${({ mode = 'fullscreen' }) => (mode === 'fullscreen' ? 0 : 'auto')};
  width: ${({ mode = 'fullscreen' }) => (mode === 'fullscreen' ? '100%' : 'auto')};
  height: ${({ mode = 'fullscreen' }) => (mode === 'fullscreen' ? '100vh' : 'auto')};
  z-index: ${({ mode = 'fullscreen' }) => (mode === 'fullscreen' ? 999 : 1)};
  flex: 1;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`
export default Screen
