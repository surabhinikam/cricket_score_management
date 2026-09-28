import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTeam, getTeamPlayers, createPlayer, deletePlayer } from '../services/api';

const TeamDetails = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add player modal
  const [showModal, setShowModal] = useState(false);
  const [playerForm, setPlayerForm] = useState({
    playerName: '',
    role: 'BATSMAN',
    jerseyNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const [tRes, pRes] = await Promise.all([
        getTeam(teamId),
        getTeamPlayers(teamId)
      ]);
      setTeam(tRes.data);
      setPlayers(pRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching team details:', err);
      setError('Failed to load team and roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createPlayer({
        ...playerForm,
        teamId: Number(teamId),
        jerseyNumber: playerForm.jerseyNumber ? Number(playerForm.jerseyNumber) : null
      });
      setShowModal(false);
      setPlayerForm({ playerName: '', role: 'BATSMAN', jerseyNumber: '' });
      fetchTeamData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding player');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlayer = async (id, name) => {
    if (!window.confirm(`Delete player ${name}?`)) return;
    try {
      await deletePlayer(id);
      fetchTeamData();
    } catch (err) {
      alert('Error deleting player');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'BATSMAN':
        return <span className="badge" style={{ background: 'rgba(99,179,237,0.15)', color: 'var(--accent-blue)' }}>🏏 Batsman</span>;
      case 'BOWLER':
        return <span className="badge" style={{ background: 'rgba(252,79,79,0.15)', color: 'var(--accent-red)' }}>🎯 Bowler</span>;
      case 'ALL_ROUNDER':
        return <span className="badge" style={{ background: 'rgba(159,122,234,0.15)', color: 'var(--accent-purple)' }}>⚡ All-Rounder</span>;
      case 'WICKET_KEEPER':
        return <span className="badge" style={{ background: 'rgba(246,224,94,0.15)', color: 'var(--accent-yellow)' }}>🧤 Wicket Keeper</span>;
      default:
        return <span className="badge">{role}</span>;
    }
  };

  if (loading) {
    return (
      <div className="container loading-container">
        <div className="spinner" />
        <p>Loading squad details...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="container error-container">
        <p>⚠️ {error || 'Team not found'}</p>
        <Link to="/teams" className="btn btn-primary">Back to Teams</Link>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px', fontSize: '0.85rem' }}>
        <Link to="/" style={{ color: 'var(--text-muted)' }}>Dashboard</Link> / 
        <Link to="/teams" style={{ color: 'var(--text-muted)', margin: '0 6px' }}>Teams</Link> / 
        <span style={{ color: 'var(--text-primary)' }}>{team.teamName}</span>
      </div>

      {/* Team Header Card */}
      <div className="card" style={{
        background: 'var(--grad-hero)',
        marginBottom: '32px',
        padding: '32px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3182ce, #805ad5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            fontWeight: 800,
            boxShadow: '0 4px 20px rgba(99,179,237,0.3)'
          }}>
            {team.shortName ? team.shortName.slice(0, 3) : '🏏'}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.2rem' }}>{team.teamName}</h1>
            <div className="text-secondary text-sm" style={{ marginTop: '4px' }}>
              🌍 {team.country || 'International'} • Code: <span className="font-bold text-blue">{team.shortName}</span>
            </div>
          </div>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + Add Player to Squad
        </button>
      </div>

      {/* Players Roster */}
      <div className="section-header">
        <div className="section-title">Official Squad ({players.length} Players)</div>
      </div>

      {players.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👥</div>
          <h3>No Players Assigned</h3>
          <p className="text-muted" style={{ margin: '8px 0 20px' }}>
            This squad currently has no registered players.
          </p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + Add First Player
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {players.map((p) => (
            <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {p.jerseyNumber && (
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      #{p.jerseyNumber}
                    </span>
                  )}
                  <span className="font-bold" style={{ fontSize: '1.05rem' }}>{p.playerName}</span>
                </div>
                <div>{getRoleBadge(p.role)}</div>
              </div>
              <button
                onClick={() => handleDeletePlayer(p.id, p.playerName)}
                className="btn btn-ghost btn-sm"
                title="Remove player"
                style={{ color: 'var(--accent-red)' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Player Modal */}
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
          <div className="card" style={{ width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Add Player to {team.shortName}</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPlayer}>
              <div className="form-group mb-4">
                <label className="form-label">Player Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Virat Kohli"
                  value={playerForm.playerName}
                  onChange={(e) => setPlayerForm({ ...playerForm, playerName: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2 mb-6">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-control"
                    value={playerForm.role}
                    onChange={(e) => setPlayerForm({ ...playerForm, role: e.target.value })}
                  >
                    <option value="BATSMAN">Batsman</option>
                    <option value="BOWLER">Bowler</option>
                    <option value="ALL_ROUNDER">All-Rounder</option>
                    <option value="WICKET_KEEPER">Wicket Keeper</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jersey Number</label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    className="form-control"
                    placeholder="18"
                    value={playerForm.jerseyNumber}
                    onChange={(e) => setPlayerForm({ ...playerForm, jerseyNumber: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetails;
