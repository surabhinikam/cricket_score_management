import React, { useState, useEffect } from 'react';
import { getPlayers, getTeams, createPlayer, updatePlayer, deletePlayer } from '../services/api';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    playerName: '',
    role: 'BATSMAN',
    jerseyNumber: '',
    teamId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, tRes] = await Promise.all([
        getPlayers(),
        getTeams()
      ]);
      setPlayers(pRes.data || []);
      setTeams(tRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to load players directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingPlayer(null);
    setFormData({
      playerName: '',
      role: 'BATSMAN',
      jerseyNumber: '',
      teamId: teams.length > 0 ? teams[0].id : ''
    });
    setShowModal(true);
  };

  const openEditModal = (player) => {
    setEditingPlayer(player);
    setFormData({
      playerName: player.playerName || '',
      role: player.role || 'BATSMAN',
      jerseyNumber: player.jerseyNumber || '',
      teamId: player.teamId || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        teamId: formData.teamId ? Number(formData.teamId) : null,
        jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : null
      };

      if (editingPlayer) {
        await updatePlayer(editingPlayer.id, payload);
      } else {
        await createPlayer(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving player');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete player ${name}?`)) return;
    try {
      await deletePlayer(id);
      fetchData();
    } catch (err) {
      alert('Error deleting player');
    }
  };

  const filteredPlayers = players.filter((p) => {
    const matchesRole = selectedRole === 'ALL' || p.role === selectedRole;
    const matchesSearch = p.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.teamName && p.teamName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

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

  return (
    <div className="container">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Players Directory</h1>
          <p className="text-secondary text-sm">
            Search, filter, and maintain player records across all franchises
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          + Add New Player
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-6" style={{ padding: '16px 20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          {/* Role pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`btn btn-sm ${selectedRole === r ? 'btn-primary' : 'btn-ghost'}`}
              >
                {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div style={{ minWidth: '240px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search by name or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading player roster...</p>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="card text-center" style={{ padding: '60px' }}>
          <h3>No players found</h3>
          <p className="text-muted" style={{ margin: '8px 0 20px' }}>
            {searchQuery || selectedRole !== 'ALL' ? 'Try changing your filter or search query.' : 'Add your first player to get started.'}
          </p>
          <button onClick={openCreateModal} className="btn btn-primary">
            + Add Player
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table card" style={{ padding: 0 }}>
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Role</th>
                <th>Jersey #</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="font-bold">{p.playerName}</div>
                    <div className="text-xs text-muted">ID: #{p.id}</div>
                  </td>
                  <td>
                    <span className="font-bold text-blue">{p.teamName || 'Free Agent'}</span>
                  </td>
                  <td>{getRoleBadge(p.role)}</td>
                  <td>
                    <span className="text-secondary font-bold">
                      {p.jerseyNumber ? `#${p.jerseyNumber}` : '-'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button onClick={() => openEditModal(p)} className="btn btn-ghost btn-sm">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id, p.playerName)} className="btn btn-danger btn-sm">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
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
              <h2>{editingPlayer ? 'Edit Player' : 'Register New Player'}</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group mb-4">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Jasprit Bumrah"
                  value={formData.playerName}
                  onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Team Assignment</label>
                <select
                  className="form-control"
                  value={formData.teamId}
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                >
                  <option value="">-- No Team (Unassigned) --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.teamName} ({t.shortName})</option>
                  ))}
                </select>
              </div>

              <div className="grid-2 mb-6">
                <div className="form-group">
                  <label className="form-label">Playing Role</label>
                  <select
                    className="form-control"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                    placeholder="93"
                    value={formData.jerseyNumber}
                    onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingPlayer ? 'Update Player' : 'Register Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Players;
