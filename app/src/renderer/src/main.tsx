import '@fontsource-variable/bricolage-grotesque'
import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ToastProvider } from './components/Toasts'
import Panel from './panel/Panel'

// The floating panel loads this same page with ?view=panel.
const isPanel = new URLSearchParams(location.search).get('view') === 'panel'
if (isPanel) document.documentElement.classList.add('panel-view')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>{isPanel ? <Panel /> : <App />}</ToastProvider>
  </StrictMode>
)
