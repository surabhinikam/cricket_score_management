import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatch, getMatchScore, getMatchInnings, startInnings, updateMatch } from '../services/api';

const MatchDetails = () => {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [score, setScore] = useState(null);
  const [innings, setInnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingInnings, setStartingInnings] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [mRes, innRes] = await Promise.all([
        getMatch(matchId),
        getMatchInnings(matchId)
      ]);
      setMatch(mRes.data);
      setInnings(innRes.data || []);

      try {
        const sRes = await getMatchScore(matchId);
        setScore(sRes.data);
      } catch (e) {
        // Score not created yet
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching match details:', err);
      setError('Failed to load match details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(() => {
      getMatchScore(matchId).then(res => setScore(res.data)).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [matchId]);

  const handleStartInnings = async (innNum) => {
    try {
      setStartingInnings(true);
      await startInnings(matchId, innNum);
      alert(`Innings ${innNum} initialized! You can now record balls in Live Scorer.`);
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Error starting innings');
    } finally {
      setStartingInnings(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!match) return;
    try {
      await updateMatch(matchId, {
        ...match,
        status: newStatus
      });
      fetchDetails();
    } catch (err) {
      alert('Error updating match status');
    }
  };

  if (loading) {
    return (
      <div className="container loading-container">
        <div className="spinner" />
        <p>Loading match information...</p>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="container error-container">
        <p>⚠️ {error || 'Match not found'}</p>
        <Link to="/" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px', fontSize: '0.85rem' }}>
        <Link to="/" style={{ color: 'var(--text-muted)' }}>Dashboard</Link> / 
        <span style={{ color: 'var(--text-primary)', marginLeft: '6px' }}>{match.title || `Match #${match.id}`}</span>
      </div>

      {/* Hero Match Card */}
      <div className="card" style={{
        background: 'var(--grad-hero)',
        marginBottom: '28px',
        padding: '32px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge ${match.status === 'LIVE' ? 'badge-live' : match.status === 'COMPLETED' ? 'badge-completed' : 'badge-upcoming'}`}>
                {match.status}
              </span>
              <span className="text-sm text-muted">{match.matchType} • {match.totalOvers} Overs</span>
            </div>
            <h1 style={{ margin: '8px 0', fontSize: '2rem' }}>
              {match.team1?.teamName || match.team1Name} vs {match.team2?.teamName || match.team2Name}
            </h1>
            <div className="text-secondary text-sm">
              🏟️ {match.venue || 'Stadium'} • 📅 {match.matchDate ? new Date(match.matchDate).toLocaleString() : 'Date TBD'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to={`/score-management?matchId=${match.id}`} className="btn btn-success">
              ⚡ Open Live Scorer
            </Link>
            <Link to={`/matches/${match.id}/scorecard`} className="btn btn-primary">
              📋 View Full Scorecard
            </Link>
          </div>
        </div>

        {/* Toss & Result Note */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 'var(--radius-md)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <div className="text-xs text-muted uppercase">Toss</div>
            <div className="text-sm font-bold mt-1">
              {(match.tossWinner?.teamName || match.tossWinnerName) ? `${match.tossWinner?.teamName || match.tossWinnerName} won the toss and elected to ${match.tossDecision?.toLowerCase()}` : (match.currentScore?.tossMessage || 'Toss information not entered')}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted uppercase">Match Status / Note</div>
            <div className="text-sm font-bold text-yellow mt-1">
              {match.currentScore?.matchResult || match.statusDescription || match.resultNote || 'Match is in progress or scheduled.'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted uppercase">Change Status</div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              {match.status !== 'LIVE' && (
                <button onClick={() => handleUpdateStatus('LIVE')} className="btn btn-danger btn-sm">Set LIVE</button>
              )}
              {match.status !== 'COMPLETED' && (
                <button onClick={() => handleUpdateStatus('COMPLETED')} className="btn btn-success btn-sm">Set COMPLETED</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Score Summary */}
      {score && (
        <div className="card mb-6" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div className="section-title">Current Score Engine</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
            <div className="score-big">
              <span className="score-runs">{score.totalRuns}</span>
              <span className="score-wickets">/{score.wickets}</span>
            </div>
            <div className="overs-text font-bold">
              ({score.oversCompleted}.{score.ballsInCurrentOver} / {match.totalOvers} Overs)
            </div>
            <div className="text-sm text-secondary" style={{ marginLeft: 'auto' }}>
              Run Rate: <span className="font-bold text-blue">{score.currentRunRate}</span>
              {score.target && (
                <span style={{ marginLeft: '16px' }}>
                  Target: <span className="font-bold text-yellow">{score.target}</span> (Req: {score.requiredRunRate})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Innings List & Controls */}
      <div className="section-header">
        <div className="section-title">Innings Management</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {innings.length === 0 && (
            <button
              onClick={() => handleStartInnings(1)}
              className="btn btn-primary btn-sm"
              disabled={startingInnings}
            >
              {startingInnings ? 'Starting...' : '+ Start 1st Innings'}
            </button>
          )}
          {innings.length === 1 && (
            <button
              onClick={() => handleStartInnings(2)}
              className="btn btn-success btn-sm"
              disabled={startingInnings}
            >
              {startingInnings ? 'Starting...' : '+ Start 2nd Innings'}
            </button>
          )}
        </div>
      </div>

      {innings.length === 0 ? (
        <div className="card text-center" style={{ padding: '40px' }}>
          <p className="text-muted">No innings started yet for this match.</p>
          <button
            onClick={() => handleStartInnings(1)}
            className="btn btn-primary btn-sm mt-3"
            disabled={startingInnings}
          >
            Start First Innings Now
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {innings.map((inn) => (
            <div key={inn.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge" style={{ background: 'rgba(99,179,237,0.15)', color: 'var(--accent-blue)' }}>
                  Innings {inn.inningsNumber}
                </span>
                <span className="text-xs text-muted">{inn.isCompleted ? 'Closed' : 'Active'}</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {inn.battingTeamName || 'Batting Team'}
              </div>
              <div className="text-xs text-muted" style={{ marginBottom: '12px' }}>
                vs {inn.bowlingTeamName || 'Bowling Team'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div>
                  <div className="score-big" style={{ fontSize: '2rem' }}>
                    <span className="score-runs">{inn.totalRuns}</span>
                    <span className="score-wickets">/{inn.totalWickets}</span>
                  </div>
                  <div className="text-xs text-muted">
                    {inn.totalOvers}.{inn.ballsInOver} Overs
                  </div>
                </div>
                <Link to={`/matches/${match.id}/scorecard`} className="btn btn-ghost btn-sm">
                  View Innings Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchDetails;
