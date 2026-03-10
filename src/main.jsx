import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import Router from "./Router";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Router />
    </AuthProvider>
  </React.StrictMode>
);