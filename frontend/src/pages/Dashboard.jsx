import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMatches, getLiveMatches, getTeams, getPlayers, createMatch } from '../services/api';

const Dashboard = () => {
  const [matches, setMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Match modal state
  const [showModal, setShowModal] = useState(false);
  const [matchForm, setMatchForm] = useState({
    title: '',
    matchType: 'T20',
    totalOvers: 20,
    venue: '',
    matchDate: new Date().toISOString().slice(0, 16),
    team1Id: '',
    team2Id: '',
    tossWinnerId: '',
    tossDecision: 'BAT'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesRes, liveRes, teamsRes, playersRes] = await Promise.all([
        getMatches(),
        getLiveMatches(),
        getTeams(),
        getPlayers()
      ]);
      setMatches(matchesRes.data || []);
      setLiveMatches(liveRes.data || []);
      setTeams(teamsRes.data || []);
      setPlayers(playersRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to connect to backend server. Make sure Spring Boot is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh live matches every 6 seconds
    const interval = setInterval(() => {
      getLiveMatches().then(res => setLiveMatches(res.data || [])).catch(() => {});
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    if (!matchForm.team1Id || !matchForm.team2Id) {
      alert('Please select both teams');
      return;
    }
    if (matchForm.team1Id === matchForm.team2Id) {
      alert('Team 1 and Team 2 must be different!');
      return;
    }

    try {
      setSubmitting(true);
      await createMatch({
        ...matchForm,
        team1Id: Number(matchForm.team1Id),
        team2Id: Number(matchForm.team2Id),
        tossWinnerId: matchForm.tossWinnerId ? Number(matchForm.tossWinnerId) : Number(matchForm.team1Id),
        totalOvers: Number(matchForm.totalOvers)
      });
      setShowModal(false);
      setMatchForm({
        title: '',
        matchType: 'T20',
        totalOvers: 20,
        venue: '',
        matchDate: new Date().toISOString().slice(0, 16),
        team1Id: '',
        team2Id: '',
        tossWinnerId: '',
        tossDecision: 'BAT'
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating match');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'LIVE':
        return <span className="badge badge-live">Live</span>;
      case 'COMPLETED':
        return <span className="badge badge-completed">Completed</span>;
      case 'UPCOMING':
        return <span className="badge badge-upcoming">Upcoming</span>;
      default:
        return <span className="badge badge-abandoned">{status}</span>;
    }
  };

  return (
    <div className="container">
      {/* Hero Welcome & Quick Stats */}
      <div style={{
        background: 'var(--grad-hero)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <span className="badge" style={{ background: 'rgba(99,179,237,0.15)', color: 'var(--accent-blue)', marginBottom: '12px' }}>
              College Assignment • Spring Boot + React
            </span>
            <h1 style={{ margin: '8px 0', fontSize: '2.4rem' }}>Cricket Score Management</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px' }}>
              Real-time ball-by-ball score calculation, dynamic run rate tracking, live scorecards, and team statistics.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-lg">
              + New Match
            </button>
            <Link to="/score-management" className="btn btn-success btn-lg">
              ⚡ Open Scorer
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid-4" style={{ marginTop: '28px' }}>
          <div className="stat-box">
            <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{matches.length}</div>
            <div className="stat-label">Total Matches</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: '#fc8181' }}>{liveMatches.length}</div>
            <div className="stat-label">Live In-Progress</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{teams.length}</div>
            <div className="stat-label">Teams Registered</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{players.length}</div>
            <div className="stat-label">Total Players</div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(252,79,79,0.12)',
          border: '1px solid rgba(252,79,79,0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#feb2b2',
          marginBottom: '28px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Live Matches Section */}
      <div style={{ marginBottom: '40px' }}>
        <div className="section-header">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fc4f4f', display: 'inline-block' }} />
            Live Matches ({liveMatches.length})
          </div>
          <Link to="/live" className="text-sm text-blue">View All Live →</Link>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><p>Loading matches...</p></div>
        ) : liveMatches.length === 0 ? (
          <div className="card text-center" style={{ padding: '36px' }}>
            <p className="text-muted">No matches are currently live.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-ghost btn-sm mt-3">
              Start a New Match
            </button>
          </div>
        ) : (
          <div className="grid-2">
            {liveMatches.map((m) => (
              <div key={m.id} className="card" style={{ borderLeft: '4px solid #fc4f4f' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span className="badge badge-live">LIVE</span>
                    <span className="text-xs text-muted" style={{ marginLeft: '8px' }}>{m.matchType} • {m.totalOvers} Overs</span>
                  </div>
                  <span className="text-xs text-secondary">{m.venue || 'Stadium'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{m.team1?.teamName || m.team1Name}</div>
                    <div className="text-xs text-muted">{m.team1?.shortName || m.team1ShortName}</div>
                  </div>
                  <div style={{ padding: '0 16px', color: 'var(--text-muted)', fontWeight: 700 }}>VS</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{m.team2?.teamName || m.team2Name}</div>
                    <div className="text-xs text-muted">{m.team2?.shortName || m.team2ShortName}</div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div className="text-xs text-muted">Status Note</div>
                    <div className="text-sm font-bold text-yellow">{m.currentScore?.matchResult || m.statusDescription || m.resultNote || 'Match in progress'}</div>
                  </div>
                  <Link to={`/matches/${m.id}`} className="btn btn-primary btn-sm">
                    View Live Score →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All / Recent Matches Section */}
      <div style={{ marginBottom: '40px' }}>
        <div className="section-header">
          <div className="section-title">Recent & Upcoming Fixtures</div>
          <button onClick={fetchData} className="btn btn-ghost btn-sm">↻ Refresh</button>
        </div>

        {matches.length === 0 ? (
          <div className="card text-center" style={{ padding: '36px' }}>
            <p className="text-muted">No matches scheduled yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table card" style={{ padding: 0 }}>
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Format</th>
                  <th>Date & Venue</th>
                  <th>Status</th>
                  <th>Result / Info</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="font-bold">{m.team1?.teamName || m.team1Name} vs {m.team2?.teamName || m.team2Name}</div>
                      <div className="text-xs text-muted">{m.title || `Match #${m.id}`}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        {m.matchType} ({m.totalOvers} ov)
                      </span>
                    </td>
                    <td>
                      <div>{m.venue || 'Standard Ground'}</div>
                      <div className="text-xs text-muted">
                        {m.matchDate ? new Date(m.matchDate).toLocaleDateString() : 'TBD'}
                      </div>
                    </td>
                    <td>{getStatusBadge(m.status)}</td>
                    <td>
                      <span className="text-sm text-secondary">{m.currentScore?.matchResult || m.statusDescription || m.resultNote || 'Scheduled'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link to={`/matches/${m.id}`} className="btn btn-ghost btn-sm">
                          Details
                        </Link>
                        <Link to={`/matches/${m.id}/scorecard`} className="btn btn-primary btn-sm">
                          Scorecard
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Match */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Schedule New Match</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMatch}>
              <div className="form-group mb-4">
                <label className="form-label">Match Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Finals - Mumbai vs Chennai"
                  value={matchForm.title}
                  onChange={(e) => setMatchForm({ ...matchForm, title: e.target.value })}
                />
              </div>

              <div className="grid-2 mb-4">
                <div className="form-group">
                  <label className="form-label">Format</label>
                  <select
                    className="form-control"
                    value={matchForm.matchType}
                    onChange={(e) => {
                      const fmt = e.target.value;
                      let ov = 20;
                      if (fmt === 'ODI') ov = 50;
                      if (fmt === 'TEST') ov = 90;
                      if (fmt === 'T10') ov = 10;
                      setMatchForm({ ...matchForm, matchType: fmt, totalOvers: ov });
                    }}
                  >
                    <option value="T20">T20 (20 Overs)</option>
                    <option value="ODI">ODI (50 Overs)</option>
                    <option value="T10">T10 (10 Overs)</option>
                    <option value="TEST">TEST (90 Overs)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Overs</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="form-control"
                    value={matchForm.totalOvers}
                    onChange={(e) => setMatchForm({ ...matchForm, totalOvers: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid-2 mb-4">
                <div className="form-group">
                  <label className="form-label">Team 1 (Home)</label>
                  <select
                    className="form-control"
                    value={matchForm.team1Id}
                    onChange={(e) => setMatchForm({ ...matchForm, team1Id: e.target.value })}
                    required
                  >
                    <option value="">-- Select Team 1 --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Team 2 (Away)</label>
                  <select
                    className="form-control"
                    value={matchForm.team2Id}
                    onChange={(e) => setMatchForm({ ...matchForm, team2Id: e.target.value })}
                    required
                  >
                    <option value="">-- Select Team 2 --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2 mb-4">
                <div className="form-group">
                  <label className="form-label">Toss Winner</label>
                  <select
                    className="form-control"
                    value={matchForm.tossWinnerId}
                    onChange={(e) => setMatchForm({ ...matchForm, tossWinnerId: e.target.value })}
                  >
                    <option value="">-- Same as Team 1 --</option>
                    {matchForm.team1Id && (
                      <option value={matchForm.team1Id}>
                        {teams.find(t => t.id === Number(matchForm.team1Id))?.name || 'Team 1'}
                      </option>
                    )}
                    {matchForm.team2Id && (
                      <option value={matchForm.team2Id}>
                        {teams.find(t => t.id === Number(matchForm.team2Id))?.name || 'Team 2'}
                      </option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Toss Decision</label>
                  <select
                    className="form-control"
                    value={matchForm.tossDecision}
                    onChange={(e) => setMatchForm({ ...matchForm, tossDecision: e.target.value })}
                  >
                    <option value="BAT">Batting First</option>
                    <option value="BOWL">Bowling First</option>
                  </select>
                </div>
              </div>

              <div className="grid-2 mb-6">
                <div className="form-group">
                  <label className="form-label">Venue</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Wankhede Stadium"
                    value={matchForm.venue}
                    onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={matchForm.matchDate}
                    onChange={(e) => setMatchForm({ ...matchForm, matchDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
