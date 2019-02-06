// import React from 'react'
// import ReactDOM from 'react-dom'
// import App from './App'

// it('renders without crashing', () => {
//   const div = document.createElement('div')
//   const notification = document.createElement('div')
//   notification.setAttribute('id', 'notification')
//   div.appendChild(notification)
//   ReactDOM.render(<App />, div)
//   ReactDOM.unmountComponentAtNode(div)
// })

import React from 'react'
import { shallow } from 'enzyme'
import App from './App'

it('render without crashing', () => {
  shallow(<App />)
})
