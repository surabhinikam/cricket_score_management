import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import LiveMatches from './pages/LiveMatches';
import MatchDetails from './pages/MatchDetails';
import Scorecard from './pages/Scorecard';
import Teams from './pages/Teams';
import TeamDetails from './pages/TeamDetails';
import Players from './pages/Players';
import ScoreManagement from './pages/ScoreManagement';
import './index.css';

function App() {
  return (
    <Router>
      <Navbar />
      <main className="page-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live" element={<LiveMatches />} />
          <Route path="/matches/:matchId" element={<MatchDetails />} />
          <Route path="/matches/:matchId/scorecard" element={<Scorecard />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:teamId" element={<TeamDetails />} />
          <Route path="/players" element={<Players />} />
          <Route path="/score-management" element={<ScoreManagement />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
