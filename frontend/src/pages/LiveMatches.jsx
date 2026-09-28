import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLiveMatches, getMatchScore } from '../services/api';

const LiveMatches = () => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchLiveScores = async () => {
    try {
      const res = await getLiveMatches();
      const matches = res.data || [];
      setLiveMatches(matches);

      // Fetch score for each live match
      const scoresMap = {};
      await Promise.all(
        matches.map(async (m) => {
          try {
            const sRes = await getMatchScore(m.id);
            scoresMap[m.id] = sRes.data;
          } catch (e) {
            // Match score might not be initialized yet
          }
        })
      );
      setScores(scoresMap);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch live matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveScores();
    const interval = setInterval(fetchLiveScores, 5000); // 5s polling for true real-time feel
    return () => clearInterval(interval);
  }, []);

  const getBallClass = (ball) => {
    if (!ball) return 'ball-0';
    if (ball.isWicket) return 'ball-W';
    if (ball.isWide) return 'ball-wd';
    if (ball.isNoBall) return 'ball-nb';
    if (ball.runsScored === 6) return 'ball-6';
    if (ball.runsScored === 4) return 'ball-4';
    if (ball.runsScored === 2 || ball.runsScored === 3) return 'ball-2';
    return 'ball-1';
  };

  return (
    <div className="container">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#fc4f4f',
              boxShadow: '0 0 10px #fc4f4f',
              animation: 'blink 1.2s infinite'
            }} />
            <h1 style={{ fontSize: '2rem', margin: 0 }}>Live Match Center</h1>
          </div>
          <p className="text-secondary text-sm" style={{ marginTop: '4px' }}>
            Real-time score updates with automatic 5-second polling • Last updated: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchLiveScores} className="btn btn-ghost btn-sm">
            ↻ Refresh Now
          </button>
          <Link to="/score-management" className="btn btn-primary btn-sm">
            ⚡ Open Live Scorer
          </Link>
        </div>
      </div>

      {loading && liveMatches.length === 0 ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Fetching real-time cricket feeds...</p>
        </div>
      ) : liveMatches.length === 0 ? (
        <div className="card text-center" style={{ padding: '60px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏟️</div>
          <h2>No Matches Currently In Progress</h2>
          <p className="text-muted" style={{ maxWidth: '460px', margin: '8px auto 20px' }}>
            There are no matches with 'LIVE' status right now. You can create a new match or start scoring from the scorer dashboard.
          </p>
          <Link to="/" className="btn btn-primary">
            Go to Fixtures & Create Match
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {liveMatches.map((m) => {
            const score = scores[m.id];
            return (
              <div
                key={m.id}
                className="card"
                style={{
                  background: 'linear-gradient(145deg, #182236 0%, #0f172a 100%)',
                  border: '1px solid rgba(99,179,237,0.25)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Top header bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '14px',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-live">LIVE</span>
                    <span className="font-bold text-sm">{m.title || `Match #${m.id}`}</span>
                    <span className="text-xs text-muted">• {m.matchType} ({m.totalOvers} Overs)</span>
                  </div>
                  <div className="text-xs text-secondary">
                    📍 {m.venue || 'Stadium'}
                  </div>
                </div>

                {/* Score Section */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                  alignItems: 'center'
                }}>
                  {/* Teams and Big Score */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{m.team1?.teamName || m.team1Name}</div>
                      <div className="text-muted text-sm font-bold">{m.team1?.shortName || m.team1ShortName}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{m.team2?.teamName || m.team2Name}</div>
                      <div className="text-muted text-sm font-bold">{m.team2?.shortName || m.team2ShortName}</div>
                    </div>

                    {score ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div className="score-big">
                          <span className="score-runs">{score.totalRuns ?? 0}</span>
                          <span className="score-wickets">/{score.wickets ?? 0}</span>
                        </div>
                        <div>
                          <div className="overs-text font-bold">
                            ({score.oversCompleted ?? 0}.{score.ballsInCurrentOver ?? 0} / {m.totalOvers} ov)
                          </div>
                          <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                            CRR: <span className="font-bold text-blue">{score.currentRunRate ?? '0.00'}</span>
                            {score.target && (
                              <span style={{ marginLeft: '12px' }}>
                                Target: <span className="font-bold text-yellow">{score.target}</span> (RRR: {score.requiredRunRate ?? '0.00'})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                        Innings pending or waiting for first delivery.
                      </div>
                    )}
                  </div>

                  {/* Batsmen / Bowler On-field details */}
                  {score && (
                    <div style={{
                      background: 'rgba(0,0,0,0.25)',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}>
                      <div className="section-title" style={{ fontSize: '0.8rem', marginBottom: 0 }}>On Pitch</div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div className="font-bold text-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🏏 {score.strikerName || 'Striker'}</span>
                            <span style={{ color: 'var(--accent-yellow)', fontSize: '0.8rem' }}>*</span>
                          </div>
                          <div className="text-xs text-muted">{score.strikerRuns ?? 0} runs ({score.strikerBalls ?? 0} balls)</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{score.nonStrikerName || 'Non-Striker'}</div>
                          <div className="text-xs text-muted">{score.nonStrikerRuns ?? 0} runs ({score.nonStrikerBalls ?? 0} balls)</div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div className="text-xs text-muted">Current Bowler</div>
                          <div className="font-bold text-sm">🎯 {score.currentBowlerName || 'Bowler'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted">Figures</div>
                          <div className="font-bold text-sm text-green">
                            {score.bowlerWickets ?? 0}/{score.bowlerRunsConceded ?? 0} ({score.bowlerOvers ?? '0.0'} ov)
                          </div>
                        </div>
                      </div>

                      {/* Recent Deliveries */}
                      {score.recentBalls && score.recentBalls.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                          <div className="text-xs text-muted" style={{ marginBottom: '6px' }}>This Over:</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {score.recentBalls.map((b, idx) => (
                              <span key={idx} className={`ball ${getBallClass(b)}`}>
                                {b.isWicket ? 'W' : b.isWide ? `${b.extras}wd` : b.isNoBall ? `${b.runsScored}nb` : b.runsScored}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '20px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div className="text-xs text-yellow font-bold">
                    📢 {m.currentScore?.matchResult || m.statusDescription || m.resultNote || 'Match is live and in progress.'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to={`/matches/${m.id}`} className="btn btn-ghost btn-sm">
                      Match Details
                    </Link>
                    <Link to={`/matches/${m.id}/scorecard`} className="btn btn-primary btn-sm">
                      Full Scorecard
                    </Link>
                    <Link to={`/score-management?matchId=${m.id}`} className="btn btn-success btn-sm">
                      ⚡ Score This Match
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveMatches;
