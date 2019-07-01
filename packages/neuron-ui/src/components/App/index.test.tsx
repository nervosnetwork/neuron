import React from 'react'
import { shallow } from 'enzyme'
import App from '.'

it('render without crashing', () => {
  shallow(<App />)
})
