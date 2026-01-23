import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ToastProvider } from './components/ui/Toast';
import * as serviceWorker from "./serviceWorker"
// import reportWebVitals from './reportWebVitals';

console.log("欢迎使用Nav项目")
console.log("项目地址: https://github.com/van579/nav")

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);

serviceWorker.register(null);