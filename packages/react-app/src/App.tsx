import React from 'react'
import logo from './logo.svg'
import './App.scss'

const App = () => (
  <div className="App">
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <p>Neuron is running...</p>
      <a
        className="App-link"
        href="https://reactjs.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        Building with React
      </a>
    </header>
  </div>
)

export default App
