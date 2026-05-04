import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.API_KEY;
const port = process.env.PORT || 3000;

console.log(`Iniciando servidor na porta ${port}`);
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);