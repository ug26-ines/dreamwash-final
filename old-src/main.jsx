import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Global CSS reset injected at runtime (keeps index.html clean)
const s = document.createElement('style')
s.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: #0c1f35;
    color: #fff;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 3px; }
  input, select, textarea, button { font-family: inherit; }
  a { color: inherit; text-decoration: none; }
  @keyframes dw-spin { to { transform: rotate(360deg); } }
  @keyframes dw-pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
  @keyframes dw-slide-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes dw-fade { from{opacity:0} to{opacity:1} }
`
document.head.appendChild(s)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
