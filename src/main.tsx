import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import CrewApp from './CrewApp.tsx';
import './index.css';

// Check if we should show Crew App based on URL parameter
const urlParams = new URLSearchParams(window.location.search);
const showCrew = urlParams.get('crew') === 'true' || window.location.pathname.includes('crew.html');

const AppComponent = showCrew ? CrewApp : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppComponent />
  </StrictMode>,
);
