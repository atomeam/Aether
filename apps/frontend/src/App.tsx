/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import SimpleDashboard from './components/SimpleDashboard';
import './index.css';

export default function App() {
  useEffect(() => {
    // Remove automatic admin authentication - users should authenticate properly
    // This was causing everyone to be in enterprise admin mode
    localStorage.removeItem('token');
    localStorage.removeItem('aether_token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }, []);

  return <SimpleDashboard />;
}
