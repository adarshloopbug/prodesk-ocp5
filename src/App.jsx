import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WorkflowEngine from './components/WorkflowEngine';
import './App.css';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('op-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('op-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={`app-shell theme-${theme}`}>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <WorkflowEngine />
    </div>
  );
}
