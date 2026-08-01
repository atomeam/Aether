import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import CrewPage from './components/CrewPage';
import { SecondBrainPage } from './components/SecondBrainPage';
import './index.css';

function resolveRoute(): string {
  const hash = window.location.hash || '';
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id') || '';

  if (hash === '#/crew' || idParam === '0/crew') return '#/crew';
  if (hash === '#/brain' || idParam === '0/brain') return '#/brain';

  return hash || '#/';
}

// Simple hash + query-param router
function Router() {
  const [route, setRoute] = useState(resolveRoute);

  useEffect(() => {
    const handleRouteChange = () => {
      setRoute(resolveRoute());
    };
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  if (route === '#/crew') {
    return <CrewPage />;
  }

  if (route === '#/brain') {
    return <SecondBrainPage />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
);
