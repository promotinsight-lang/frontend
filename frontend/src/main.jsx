import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// ==========================================
// 🚀 APPLICATION ENTRY POINT
// ==========================================
// This is the root of the React application.
// Enterprise security (HttpOnly Cookies, CSRF protection) 
// and dynamic routing are handled inside <App />.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);