/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import SimpleDashboard from './components/SimpleDashboard';
import './index.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    // Check if user has seen landing page
    const hasSeenLanding = localStorage.getItem('hasSeenLanding');
    setShowLanding(!hasSeenLanding);
  }, []);

  const handleEnterDashboard = () => {
    localStorage.setItem('hasSeenLanding', 'true');
    setShowLanding(false);
  };

  if (showLanding) {
    return <LandingPage onEnterDashboard={handleEnterDashboard} />;
  }

  if (isAuthenticated) {
    return <SimpleDashboard />;
  }

  return <LandingPage onEnterDashboard={handleEnterDashboard} />;
}
