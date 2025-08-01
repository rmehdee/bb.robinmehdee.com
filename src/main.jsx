import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Entry point of the React application.  We hydrate the root div defined
// in index.html and render our App component.  React.StrictMode helps
// catch potential problems by activating additional checks and warnings.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);