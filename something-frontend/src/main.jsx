import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "./styles/reset.css"
import './i18n/index.js'

import App from './App.jsx'
import { ThemeProvider } from "./Theme";
import { VoiceCommandProvider } from './assets/components/VoiceCommandContext.jsx';


createRoot(document.getElementById('root')).render(
  // <StrictMode>
   <ThemeProvider>
     <VoiceCommandProvider  > 
       <App />
     </VoiceCommandProvider>
   </ThemeProvider>
 
   
  // </StrictMode>,
)
