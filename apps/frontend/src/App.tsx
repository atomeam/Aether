/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import SimpleDashboard from './components/SimpleDashboard';
import './index.css';

// Hardcoded admin credentials for automatic access
const ADMIN_TOKEN = 'admin_automatic_access_token_2026';
const ADMIN_USER = {
  id: 'admin',
  email: 'admin@a-to-mind.com',
  role: 'admin',
  permissions: ['all'],
  plan: 'enterprise'
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    // Automatic admin authentication for owner
    const adminToken = 'admin_automatic_access_token_2026';
    localStorage.setItem('token', adminToken);
    localStorage.setItem('aether_token', adminToken); // For backwards compatibility
    localStorage.setItem('user', JSON.stringify(ADMIN_USER));
    setIsAuthenticated(true);
    
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

  return <SimpleDashboard />;
}
