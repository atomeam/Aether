/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import LandingPage from './components/LandingPage';
import SimpleDashboard from './components/SimpleDashboard';
import { KnowledgeHub } from './components/KnowledgeHub';
import './index.css';

export default function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [showKnowledgeHub, setShowKnowledgeHub] = useState(false);

  useEffect(() => {
    // Remove any old authentication tokens
    localStorage.removeItem('token');
    localStorage.removeItem('aether_token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }, []);

  if (showKnowledgeHub) {
    return <KnowledgeHub apiUrl={import.meta.env.VITE_API_URL || 'http://localhost:3002'} />;
  }

  if (showDashboard) {
    return <SimpleDashboard onShowKnowledgeHub={() => setShowKnowledgeHub(true)} />;
  }

  return <LandingPage onLaunchDashboard={() => setShowDashboard(true)} onShowKnowledgeHub={() => setShowKnowledgeHub(true)} />;
}
