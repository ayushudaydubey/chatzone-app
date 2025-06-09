import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import Context from './Context/Context';
import {ToastContainer} from  'react-toastify'
createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <BrowserRouter>
    
      <Context>
        <App />
        <ToastContainer/>
      </Context>
    </BrowserRouter>
  // </React.StrictMode>
);
