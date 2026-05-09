import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

const PaymentDue = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8d7da', color: '#721c24', fontFamily: 'sans-serif', flexDirection: 'column', textAlign: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Access Suspended</h1>
        <p style={{ fontSize: '1.5rem' }}>Please pay the pending dues to continue using this project.</p>
    </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
    <PaymentDue />
    // <BrowserRouter>
    //     <React.StrictMode>
    //         <App />
    //     </React.StrictMode>,
    // </BrowserRouter>
)
