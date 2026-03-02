import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './AeroPaceStudio.tsx' // Import de votre application principale
import './index.css' // Import de Tailwind CSS (si vous avez créé ce fichier)

// On cible la div "root" de l'index.html et on y rend l'application
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
