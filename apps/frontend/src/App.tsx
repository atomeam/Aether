/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import SimpleDashboard from './components/SimpleDashboard';
import './index.css';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);

  const handleEnterDashboard = () => {
    setShowLanding(false);
  };

  if (showLanding) {
    return <LandingPage onEnterDashboard={handleEnterDashboard} />;
  }

  return <SimpleDashboard />;
}
