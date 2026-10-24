import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Controller from './controller/Controller'
import './index.css'

const room = new URLSearchParams(window.location.search).get('c')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {room ? <Controller room={room.toUpperCase()} /> : <App />}
  </React.StrictMode>
)