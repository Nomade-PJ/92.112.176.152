import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Importar ferramentas de console
import './lib/console-tools';

createRoot(document.getElementById("root")!).render(<App />);
