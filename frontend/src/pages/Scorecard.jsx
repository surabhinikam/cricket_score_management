import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScorecard } from '../services/api';

const Scorecard = () => {
  const { matchId } = useParams();
  const [scorecard, setScorecard] = useState(null);
  const [activeInningsIndex, setActiveInningsIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchScorecard = async () => {
    try {
      setLoading(true);
      const res = await getScorecard(matchId);
      setScorecard(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching scorecard:', err);
      setError('Failed to load scorecard for this match.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecard();
    // Poll scorecard every 6s if match is LIVE
    const interval = setInterval(() => {
      getScorecard(matchId).then(res => setScorecard(res.data)).catch(() => {});
    }, 6000);
    return () => clearInterval(interval);
  }, [matchId]);

  if (loading) {
    return (
      <div className="container loading-container">
        <div className="spinner" />
        <p>Generating real-time cricket scorecard...</p>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="container error-container">
        <p>⚠️ {error || 'Scorecard not found'}</p>
        <Link to="/" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  const inningsList = scorecard.inningsList || [];
  const activeInnings = inningsList[activeInningsIndex] || inningsList[0];

  return (
    <div className="container">
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '16px', fontSize: '0.85rem' }}>
        <Link to="/" style={{ color: 'var(--text-muted)' }}>Dashboard</Link> / 
        <Link to={`/matches/${matchId}`} style={{ color: 'var(--text-muted)', margin: '0 6px' }}>Match #{matchId}</Link> / 
        <span style={{ color: 'var(--text-primary)' }}>Scorecard</span>
      </div>

      {/* Match Header Banner */}
      <div className="card" style={{
        background: 'var(--grad-hero)',
        marginBottom: '28px',
        padding: '28px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${scorecard.status === 'LIVE' ? 'badge-live' : scorecard.status === 'COMPLETED' ? 'badge-completed' : 'badge-upcoming'}`}>
                {scorecard.status}
              </span>
              <span className="text-sm text-muted">{scorecard.matchType} • {scorecard.totalOvers} Overs</span>
            </div>
            <h1 style={{ margin: '8px 0', fontSize: '2rem' }}>{scorecard.matchTitle || `Match #${matchId}`}</h1>
            <div className="text-secondary text-sm">
              📍 {scorecard.venue || 'Stadium'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchScorecard} className="btn btn-ghost btn-sm">↻ Refresh</button>
            <Link to={`/score-management?matchId=${matchId}`} className="btn btn-primary btn-sm">
              ⚡ Open Live Scorer
            </Link>
          </div>
        </div>

        {/* Toss & Result Highlights */}
        {(scorecard.tossMessage || scorecard.result) && (
          <div style={{
            marginTop: '20px',
            padding: '12px 18px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {scorecard.tossMessage && (
              <div className="text-sm text-secondary">
                🪙 <span className="font-bold text-primary">{scorecard.tossMessage}</span>
              </div>
            )}
            {scorecard.result && (
              <div className="text-sm font-bold text-yellow">
                🏆 {scorecard.result}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Innings Tabs */}
      {inningsList.length === 0 ? (
        <div className="card text-center" style={{ padding: '60px' }}>
          <h3>No innings data available yet</h3>
          <p className="text-muted" style={{ margin: '8px 0 20px' }}>
            The match has been scheduled, but innings haven't commenced.
          </p>
          <Link to={`/matches/${matchId}`} className="btn btn-primary">
            Go to Match Details & Start Innings
          </Link>
        </div>
      ) : (
        <div>
          <div className="tabs">
            {inningsList.map((inn, idx) => (
              <button
                key={inn.inningsId || idx}
                className={`tab-btn ${activeInningsIndex === idx ? 'active' : ''}`}
                onClick={() => setActiveInningsIndex(idx)}
              >
                {inn.battingTeamName} ({inn.totalRuns}/{inn.wickets} in {inn.overs} ov)
              </button>
            ))}
          </div>

          {activeInnings && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Innings Overview Bar */}
              <div className="card" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                background: 'linear-gradient(145deg, #162032 0%, #101826 100%)'
              }}>
                <div>
                  <div className="text-xs text-muted uppercase">Batting Team</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{activeInnings.battingTeamName}</div>
                  <div className="text-xs text-secondary">vs {activeInnings.bowlingTeamName}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                  <div className="score-big" style={{ fontSize: '2.5rem' }}>
                    <span className="score-runs">{activeInnings.totalRuns}</span>
                    <span className="score-wickets">/{activeInnings.wickets}</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm">Overs: {activeInnings.overs}</div>
                    <div className="text-xs text-muted">Run Rate: {activeInnings.runRate?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
              </div>

              {/* Batting Card Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <div className="font-bold text-sm uppercase tracking-wide">Batting Performance</div>
                  <div className="text-xs text-muted">Runs • Balls • 4s • 6s • Strike Rate</div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Batter</th>
                        <th>Dismissal</th>
                        <th style={{ textAlign: 'right' }}>R</th>
                        <th style={{ textAlign: 'right' }}>B</th>
                        <th style={{ textAlign: 'right' }}>4s</th>
                        <th style={{ textAlign: 'right' }}>6s</th>
                        <th style={{ textAlign: 'right' }}>SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeInnings.battingStats && activeInnings.battingStats.length > 0 ? (
                        activeInnings.battingStats.map((bat, idx) => (
                          <tr key={bat.playerId || idx}>
                            <td>
                              <span className="font-bold">{bat.playerName}</span>
                              {!bat.isOut && <span style={{ color: 'var(--accent-yellow)', marginLeft: '4px' }}>*</span>}
                            </td>
                            <td>
                              <span className="text-xs text-secondary" style={{ fontStyle: 'italic' }}>
                                {bat.dismissalInfo || (bat.isOut ? 'out' : 'not out')}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-blue)' }}>
                              {bat.runs}
                            </td>
                            <td style={{ textAlign: 'right' }}>{bat.balls}</td>
                            <td style={{ textAlign: 'right', color: 'var(--accent-green)' }}>{bat.fours}</td>
                            <td style={{ textAlign: 'right', color: 'var(--accent-purple)' }}>{bat.sixes}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                              {bat.strikeRate ? bat.strikeRate.toFixed(1) : '0.0'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                            No batting stats recorded yet.
                          </td>
                        </tr>
                      )}
                      {/* Extras and Total Row */}
                      <tr style={{ background: 'rgba(255,255,255,0.02)', fontWeight: 600 }}>
                        <td colSpan="2">Extras</td>
                        <td colSpan="5" style={{ textAlign: 'right', color: 'var(--accent-yellow)' }}>
                          {activeInnings.extras || 0}
                        </td>
                      </tr>
                      <tr style={{ background: 'rgba(255,255,255,0.04)', fontWeight: 800 }}>
                        <td colSpan="2">Total ({activeInnings.wickets} wkts, {activeInnings.overs} ov)</td>
                        <td style={{ textAlign: 'right', color: 'var(--accent-blue)', fontSize: '1.1rem' }}>
                          {activeInnings.totalRuns}
                        </td>
                        <td colSpan="4" style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          RR: {activeInnings.runRate?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bowling Card Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <div className="font-bold text-sm uppercase tracking-wide">Bowling Figures</div>
                  <div className="text-xs text-muted">Overs • Maidens • Runs • Wickets • Economy</div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bowler</th>
                        <th style={{ textAlign: 'right' }}>O</th>
                        <th style={{ textAlign: 'right' }}>M</th>
                        <th style={{ textAlign: 'right' }}>R</th>
                        <th style={{ textAlign: 'right' }}>W</th>
                        <th style={{ textAlign: 'right' }}>ECON</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeInnings.bowlingStats && activeInnings.bowlingStats.length > 0 ? (
                        activeInnings.bowlingStats.map((bowl, idx) => (
                          <tr key={bowl.playerId || idx}>
                            <td className="font-bold">{bowl.playerName}</td>
                            <td style={{ textAlign: 'right' }}>{bowl.overs}</td>
                            <td style={{ textAlign: 'right' }}>{bowl.maidens}</td>
                            <td style={{ textAlign: 'right' }}>{bowl.runsConceded}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-red)' }}>
                              {bowl.wickets}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-green)' }}>
                              {bowl.economy ? bowl.economy.toFixed(2) : '0.00'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                            No bowling stats recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Scorecard;
