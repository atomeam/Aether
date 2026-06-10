import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/react';
import App from './App.tsx';
import CrewPage from './components/CrewPage';
import AuthPage from './components/AuthPage';
import './index.css';

// Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Simple hash-based router
function Router() {
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Route to component mapping
  if (route === '#/auth') {
    return <AuthPage />;
  }

  if (route === '#/crew') {
    return (
      <SignedIn>
        <CrewPage />
      </SignedIn>
    );
  }

  // Default to main App (protected)
  return (
    <>
      <SignedIn>
        <App />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router />
    </ClerkProvider>
  </StrictMode>,
);
