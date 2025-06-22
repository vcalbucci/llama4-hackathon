import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Hide loading screen
const loadingScreen = document.querySelector('.loading-screen');
if (loadingScreen) {
  loadingScreen.style.display = 'none';
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
