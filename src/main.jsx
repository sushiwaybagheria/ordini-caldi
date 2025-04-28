import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import OrdiniCaldi from './OrdiniCaldi'
import Storico from './Storico' // 👈 devi creare Storico.jsx

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OrdiniCaldi />} />
        <Route path="/Storico" element={<Storico />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
