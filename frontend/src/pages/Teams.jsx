import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTeams, createTeam, updateTeam, deleteTeam } from '../services/api';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    teamName: '',
    shortName: '',
    country: '',
    logoUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await getTeams();
      setTeams(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const openCreateModal = () => {
    setEditingTeam(null);
    setFormData({ teamName: '', shortName: '', country: '', logoUrl: '' });
    setShowModal(true);
  };

  const openEditModal = (team) => {
    setEditingTeam(team);
    setFormData({
      teamName: team.teamName || '',
      shortName: team.shortName || '',
      country: team.country || '',
      logoUrl: team.logoUrl || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingTeam) {
        await updateTeam(editingTeam.id, formData);
      } else {
        await createTeam(formData);
      }
      setShowModal(false);
      fetchTeams();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteTeam(id);
      fetchTeams();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting team. Team may have players or matches associated with it.');
    }
  };

  return (
    <div className="container">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Cricket Teams</h1>
          <p className="text-secondary text-sm">
            Manage participating squads, club rosters, and team profiles
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          + Add New Team
        </button>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          background: 'rgba(252,79,79,0.12)',
          border: '1px solid rgba(252,79,79,0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#feb2b2',
          marginBottom: '24px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="card text-center" style={{ padding: '60px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛡️</div>
          <h2>No Teams Registered Yet</h2>
          <p className="text-muted" style={{ margin: '8px 0 20px' }}>
            Get started by creating your first cricket team.
          </p>
          <button onClick={openCreateModal} className="btn btn-primary">
            + Create Team Now
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {teams.map((t) => (
            <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(99,179,237,0.2), rgba(128,90,213,0.2))',
                    border: '1px solid rgba(99,179,237,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: 'var(--accent-blue)'
                  }}>
                    {t.shortName ? t.shortName.slice(0, 3).toUpperCase() : '🏏'}
                  </div>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {t.country || 'Global'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{t.teamName}</h3>
                <div className="text-xs text-muted" style={{ marginBottom: '16px' }}>
                  Short Code: <span className="font-bold text-secondary">{t.shortName || 'N/A'}</span>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <span className="text-xs text-muted">Squad Strength</span>
                  <span className="font-bold text-sm text-blue">{t.playerCount ?? 0} Players</span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '12px'
              }}>
                <Link to={`/teams/${t.id}`} className="btn btn-ghost btn-sm">
                  View Squad →
                </Link>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => openEditModal(t)} className="btn btn-ghost btn-sm" title="Edit">
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(t.id, t.teamName)} className="btn btn-danger btn-sm" title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Create/Edit Modal */}
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
          <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>{editingTeam ? 'Edit Team' : 'Create New Team'}</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group mb-4">
                <label className="form-label">Team Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Royal Challengers Bangalore"
                  value={formData.teamName}
                  onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2 mb-4">
                <div className="form-group">
                  <label className="form-label">Short Name *</label>
                  <input
                    type="text"
                    maxLength="5"
                    className="form-control"
                    placeholder="e.g. RCB"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country / Region</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. India"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group mb-6">
                <label className="form-label">Logo URL (Optional)</label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://example.com/logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
