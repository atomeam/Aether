/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
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
  useEffect(() => {
    // Automatic admin authentication for owner
    localStorage.setItem('token', ADMIN_TOKEN);
    localStorage.setItem('aether_token', ADMIN_TOKEN);
    localStorage.setItem('user', JSON.stringify(ADMIN_USER));
    localStorage.setItem('hasSeenLanding', 'true');
  }, []);

  return <SimpleDashboard />;
}
