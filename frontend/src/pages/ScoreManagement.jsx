import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  getMatches,
  getMatch,
  getMatchInnings,
  startInnings,
  recordBall,
  getBallEvents,
  getTeamPlayers,
  updateMatch
} from '../services/api';

const ScoreManagement = () => {
  const [searchParams] = useSearchParams();
  const initialMatchId = searchParams.get('matchId') || '';

  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(initialMatchId);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [inningsList, setInningsList] = useState([]);
  const [selectedInningsId, setSelectedInningsId] = useState('');
  const [currentInnings, setCurrentInnings] = useState(null);

  // Players
  const [battingPlayers, setBattingPlayers] = useState([]);
  const [bowlingPlayers, setBowlingPlayers] = useState([]);
  const [strikerId, setStrikerId] = useState('');
  const [nonStrikerId, setNonStrikerId] = useState('');
  const [bowlerId, setBowlerId] = useState('');

  // Ball History
  const [ballHistory, setBallHistory] = useState([]);

  // Scoring controls state
  const [loading, setLoading] = useState(false);
  const [submittingBall, setSubmittingBall] = useState(false);
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [wicketType, setWicketType] = useState('BOWLED');
  const [dismissedId, setDismissedId] = useState('');
  const [runsOnWicket, setRunsOnWicket] = useState(0);

  // Fetch matches list on mount
  useEffect(() => {
    getMatches().then((res) => {
      const list = res.data || [];
      setMatches(list);
      if (!selectedMatchId && list.length > 0) {
        // default to first live match or first match
        const live = list.find((m) => m.status === 'LIVE');
        setSelectedMatchId(live ? live.id : list[0].id);
      }
    }).catch(console.error);
  }, []);

  // Whenever selectedMatchId changes, fetch match details and innings
  useEffect(() => {
    if (!selectedMatchId) return;

    const loadMatchAndInnings = async () => {
      try {
        setLoading(true);
        const [mRes, innRes] = await Promise.all([
          getMatch(selectedMatchId),
          getMatchInnings(selectedMatchId)
        ]);
        setCurrentMatch(mRes.data);
        const inList = innRes.data || [];
        setInningsList(inList);

        if (inList.length > 0) {
          // Select active innings or latest innings
          const active = inList.find((i) => !i.isCompleted) || inList[inList.length - 1];
          setSelectedInningsId(active.id);
        } else {
          setSelectedInningsId('');
          setCurrentInnings(null);
        }
      } catch (err) {
        console.error('Error loading match:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMatchAndInnings();
  }, [selectedMatchId]);

  // Whenever selectedInningsId changes, load innings data, team players, and ball history
  useEffect(() => {
    if (!selectedInningsId || !currentMatch) return;

    const inn = inningsList.find((i) => i.id === Number(selectedInningsId));
    if (!inn) return;
    setCurrentInnings(inn);

    const loadInningsDetails = async () => {
      try {
        const [batRes, bowlRes, ballsRes] = await Promise.all([
          getTeamPlayers(inn.battingTeamId),
          getTeamPlayers(inn.bowlingTeamId),
          getBallEvents(inn.id)
        ]);

        const batList = batRes.data || [];
        const bowlList = bowlRes.data || [];
        setBattingPlayers(batList);
        setBowlingPlayers(bowlList);
        setBallHistory(ballsRes.data || []);

        // Pre-select striker, non-striker, bowler if not set
        if (batList.length >= 2) {
          if (!strikerId || !batList.some(p => p.id === Number(strikerId))) {
            setStrikerId(batList[0].id);
            setDismissedId(batList[0].id);
          }
          if (!nonStrikerId || !batList.some(p => p.id === Number(nonStrikerId))) {
            setNonStrikerId(batList[1].id);
          }
        }
        if (bowlList.length > 0 && (!bowlerId || !bowlList.some(p => p.id === Number(bowlerId)))) {
          setBowlerId(bowlList[0].id);
        }
      } catch (err) {
        console.error('Error loading innings players:', err);
      }
    };

    loadInningsDetails();
  }, [selectedInningsId, inningsList, currentMatch]);

  const refreshInningsData = async () => {
    if (!selectedMatchId || !selectedInningsId) return;
    try {
      const [mRes, innRes, ballsRes] = await Promise.all([
        getMatch(selectedMatchId),
        getMatchInnings(selectedMatchId),
        getBallEvents(selectedInningsId)
      ]);
      setCurrentMatch(mRes.data);
      const inList = innRes.data || [];
      setInningsList(inList);
      const curr = inList.find((i) => i.id === Number(selectedInningsId));
      if (curr) setCurrentInnings(curr);
      setBallHistory(ballsRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartInnings = async (innNum) => {
    try {
      setLoading(true);
      await startInnings(selectedMatchId, innNum);
      const innRes = await getMatchInnings(selectedMatchId);
      const inList = innRes.data || [];
      setInningsList(inList);
      if (inList.length > 0) {
        setSelectedInningsId(inList[inList.length - 1].id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error starting innings');
    } finally {
      setLoading(false);
    }
  };

  const handleSetLive = async () => {
    if (!currentMatch) return;
    try {
      await updateMatch(selectedMatchId, {
        ...currentMatch,
        status: 'LIVE'
      });
      const mRes = await getMatch(selectedMatchId);
      setCurrentMatch(mRes.data);
    } catch (err) {
      alert('Error updating status to LIVE');
    }
  };

  const swapStrike = () => {
    const temp = strikerId;
    setStrikerId(nonStrikerId);
    setNonStrikerId(temp);
    setDismissedId(nonStrikerId);
  };

  const submitBallEvent = async (ballData) => {
    if (!currentMatch) return;
    if (currentMatch.status !== 'LIVE') {
      alert('Match is not LIVE. Please click "Set Match to LIVE" first!');
      return;
    }
    if (!strikerId || !bowlerId) {
      alert('Please select both Striker and Bowler before scoring!');
      return;
    }

    try {
      setSubmittingBall(true);
      const payload = {
        batsmanId: Number(strikerId),
        bowlerId: Number(bowlerId),
        runsOffBat: ballData.runsOffBat ?? 0,
        extras: ballData.extras ?? 0,
        extraType: ballData.extraType || null,
        wicket: Boolean(ballData.wicket),
        wicketType: ballData.wicketType || null,
        dismissedPlayerId: ballData.dismissedPlayerId ? Number(ballData.dismissedPlayerId) : Number(strikerId)
      };

      await recordBall(selectedInningsId, payload);

      // Auto-strike rotation on odd runs (1, 3) if not an extra without strike change
      if (payload.runsOffBat === 1 || payload.runsOffBat === 3) {
        swapStrike();
      }

      await refreshInningsData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording ball event');
    } finally {
      setSubmittingBall(false);
      setWicketModalOpen(false);
    }
  };

  const handleRegularRun = (runs) => {
    submitBallEvent({
      runsOffBat: runs,
      extras: 0,
      extraType: null,
      wicket: false
    });
  };

  const handleExtra = (type) => {
    submitBallEvent({
      runsOffBat: 0,
      extras: 1,
      extraType: type,
      wicket: false
    });
  };

  const handleWicketSubmit = (e) => {
    e.preventDefault();
    submitBallEvent({
      runsOffBat: runsOnWicket,
      extras: 0,
      extraType: null,
      wicket: true,
      wicketType: wicketType,
      dismissedPlayerId: dismissedId || strikerId
    });
  };

  return (
    <div className="container">
      {/* Top Header & Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>Live Scorer Console</h1>
          </div>
          <p className="text-secondary text-sm">
            Instant ball-by-ball event entry with automatic strike rotation, overs counting & live updates
          </p>
        </div>

        {/* Match Selection Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label className="text-sm font-bold text-muted uppercase">Select Match:</label>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '220px', fontWeight: 600 }}
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.team1?.shortName || m.team1ShortName || m.team1?.teamName} vs {m.team2?.shortName || m.team2ShortName || m.team2?.teamName} ({m.status})
              </option>
            ))}
          </select>
          <button onClick={refreshInningsData} className="btn btn-ghost btn-sm" title="Refresh">
            ↻
          </button>
        </div>
      </div>

      {/* Match Status Banner if not LIVE */}
      {currentMatch && currentMatch.status !== 'LIVE' && (
        <div style={{
          background: 'rgba(237,137,54,0.15)',
          border: '1px solid rgba(237,137,54,0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div className="font-bold text-yellow" style={{ fontSize: '1rem' }}>
              ⚠️ Match status is currently "{currentMatch.status}".
            </div>
            <div className="text-xs text-secondary mt-1">
              Ball events can only be recorded when the match is LIVE.
            </div>
          </div>
          <button onClick={handleSetLive} className="btn btn-success btn-sm">
            ▶ Set Match to LIVE
          </button>
        </div>
      )}

      {/* No Innings Banner */}
      {currentMatch && inningsList.length === 0 && (
        <div className="card text-center mb-6" style={{ padding: '40px' }}>
          <h3>No Innings Started</h3>
          <p className="text-muted" style={{ margin: '8px 0 20px' }}>
            First innings must be started to begin ball-by-ball recording.
          </p>
          <button onClick={() => handleStartInnings(1)} className="btn btn-primary btn-lg" disabled={loading}>
            Start 1st Innings
          </button>
        </div>
      )}

      {currentMatch && inningsList.length > 0 && (
        <>
          {/* Innings Selector Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="tabs" style={{ marginBottom: 0 }}>
              {inningsList.map((inn) => (
                <button
                  key={inn.id}
                  className={`tab-btn ${inn.id === Number(selectedInningsId) ? 'active' : ''}`}
                  onClick={() => setSelectedInningsId(inn.id)}
                >
                  Innings {inn.inningsNumber}: {inn.battingTeamName} {inn.isCompleted ? '(Done)' : '(Active)'}
                </button>
              ))}
            </div>

            {inningsList.length === 1 && currentInnings?.isCompleted && (
              <button onClick={() => handleStartInnings(2)} className="btn btn-success btn-sm">
                + Start 2nd Innings
              </button>
            )}
          </div>

          {currentInnings && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              {/* Left Column: Big Score, Striker/Bowler Selectors, Scoring Keypad */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Live Innings Scorecard Card */}
                <div className="card" style={{
                  background: 'linear-gradient(145deg, #182438 0%, #0e1626 100%)',
                  border: '1px solid rgba(99,179,237,0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <div className="text-xs text-muted uppercase">Batting</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{currentInnings.battingTeamName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted uppercase">Bowling</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {currentInnings.bowlingTeamName}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
                    <div className="score-big">
                      <span className="score-runs">{currentInnings.totalRuns}</span>
                      <span className="score-wickets">/{currentInnings.totalWickets}</span>
                    </div>
                    <div>
                      <div className="overs-text font-bold" style={{ fontSize: '1.2rem' }}>
                        {currentInnings.totalOvers}.{currentInnings.ballsInOver} / {currentMatch.totalOvers} Overs
                      </div>
                      <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                        Run Rate: <span className="font-bold text-blue">
                          {currentInnings.legalBalls > 0 ? ((currentInnings.totalRuns / currentInnings.legalBalls) * 6).toFixed(2) : '0.00'}
                        </span>
                        <span style={{ marginLeft: '12px' }}>Extras: {currentInnings.extras}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pitch Setup: Active Striker, Non-Striker & Bowler */}
                <div className="card" style={{ padding: '20px' }}>
                  <div className="section-title" style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                    Active Players on Field
                  </div>

                  <div className="grid-3" style={{ gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>🏏 Striker *</span>
                        <span style={{ color: 'var(--accent-yellow)' }}>★</span>
                      </label>
                      <select
                        className="form-control"
                        value={strikerId}
                        onChange={(e) => {
                          setStrikerId(e.target.value);
                          setDismissedId(e.target.value);
                        }}
                      >
                        {battingPlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.playerName} ({p.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">🏃 Non-Striker</label>
                      <select
                        className="form-control"
                        value={nonStrikerId}
                        onChange={(e) => setNonStrikerId(e.target.value)}
                      >
                        {battingPlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.playerName} ({p.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">🎯 Current Bowler *</label>
                      <select
                        className="form-control"
                        value={bowlerId}
                        onChange={(e) => setBowlerId(e.target.value)}
                      >
                        {bowlingPlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.playerName} ({p.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={swapStrike} type="button" className="btn btn-ghost btn-sm">
                      ⇄ Swap Strike
                    </button>
                  </div>
                </div>

                {/* Scoring Keypad Controls */}
                <div className="card" style={{ padding: '24px' }}>
                  <div className="section-title" style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                    Record Delivery Event
                  </div>

                  {/* Regular Runs Keypad */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '10px',
                    marginBottom: '16px'
                  }}>
                    <button
                      disabled={submittingBall}
                      onClick={() => handleRegularRun(0)}
                      className="run-btn run-0"
                    >
                      0
                      <span className="text-xs text-muted" style={{ fontWeight: 400 }}>Dot</span>
                    </button>
                    <button
                      disabled={submittingBall}
                      onClick={() => handleRegularRun(1)}
                      className="run-btn run-1"
                    >
                      1
                      <span className="text-xs text-muted" style={{ fontWeight: 400 }}>Single</span>
                    </button>
                    <button
                      disabled={submittingBall}
                      onClick={() => handleRegularRun(2)}
                      className="run-btn run-2"
                    >
                      2
                      <span className="text-xs text-muted" style={{ fontWeight: 400 }}>Double</span>
                    </button>
                    <button
                      disabled={submittingBall}
                      onClick={() => handleRegularRun(3)}
                      className="run-btn run-3"
                    >
                      3
                      <span className="text-xs text-muted" style={{ fontWeight: 400 }}>Three</span>
                    </button>
                    <button
                      disabled={submittingBall}
                      onClick={() => handleRegularRun(4)}
                      className="run-btn run-4"
                    >
                      4
                      <span className="text-xs font-bold" style={{ fontWeight: 600 }}>FOUR</span>
                    </button>
                    <button
                      disabled={submittingBall}
                      onClick={() => handleRegularRun(6)}
                      className="run-btn run-6"
                    >
                      6
                      <span className="text-xs font-bold" style={{ fontWeight: 600 }}>SIX</span>
                    </button>
                  </div>

                  {/* Extras & Wicket Controls */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '10px'
                  }}>
                    <button
                      disabled={submittingBall}
                      onClick={() => handleExtra('WIDE')}
                      className="run-btn run-wide"
                    >
                      WD
                      <span className="text-xs" style={{ fontWeight: 400 }}>Wide (+1)</span>
                    </button>
                    <button
                      disabled={submittingBall}
                      onClick={() => handleExtra('NO_BALL')}
                      className="run-btn run-noball"
                    >
                      NB
                      <span className="text-xs" style={{ fontWeight: 400 }}>No Ball (+1)</span>
                    </button>
                    <button
                      disabled={submittingBall}
                      onClick={() => handleExtra('BYE')}
                      className="run-btn run-bye"
                    >
                      B
                      <span className="text-xs" style={{ fontWeight: 400 }}>Bye (+1)</span>
                    </button>
                    <button
                      disabled={submittingBall}
                      onClick={() => handleExtra('LEG_BYE')}
                      className="run-btn run-bye"
                    >
                      LB
                      <span className="text-xs" style={{ fontWeight: 400 }}>Leg Bye (+1)</span>
                    </button>
                    <button
                      disabled={submittingBall}
                      onClick={() => setWicketModalOpen(true)}
                      className="run-btn run-wicket"
                    >
                      W
                      <span className="text-xs font-bold">WICKET</span>
                    </button>
                  </div>

                  {submittingBall && (
                    <div className="text-center text-sm text-blue mt-3">
                      Processing delivery & syncing real-time state...
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Ball By Ball Event Feed */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '720px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div className="font-bold text-sm uppercase tracking-wide">Ball-by-Ball Timeline</div>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {ballHistory.length} Balls
                  </span>
                </div>

                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingRight: '6px'
                }}>
                  {ballHistory.length === 0 ? (
                    <div className="text-center text-muted text-sm" style={{ padding: '40px 0' }}>
                      No balls recorded in this innings yet.
                    </div>
                  ) : (
                    ballHistory.slice().reverse().map((b) => (
                      <div
                        key={b.id}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div className="text-xs text-muted font-bold">
                            Over {b.overNumber}.{b.ballNumber}
                          </div>
                          <div className="text-xs" style={{ marginTop: '2px' }}>
                            <span className="font-bold text-primary">{b.batsmanName}</span> vs {b.bowlerName}
                          </div>
                          {b.wicket && (
                            <div className="text-xs text-red font-bold" style={{ marginTop: '2px' }}>
                              Wicket: {b.wicketType} ({b.dismissedPlayerName || b.batsmanName})
                            </div>
                          )}
                        </div>

                        <div>
                          <span className={`ball ${
                            b.wicket ? 'ball-W' :
                            b.extraType === 'WIDE' ? 'ball-wd' :
                            b.extraType === 'NO_BALL' ? 'ball-nb' :
                            b.runsOffBat === 6 ? 'ball-6' :
                            b.runsOffBat === 4 ? 'ball-4' :
                            b.runsOffBat === 0 ? 'ball-0' : 'ball-1'
                          }`}>
                            {b.wicket ? 'W' : b.extraType ? (b.extraType === 'WIDE' ? 'wd' : 'nb') : b.runsOffBat}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <Link to={`/matches/${selectedMatchId}/scorecard`} className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'center' }}>
                    View Full Scorecard →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Wicket Modal */}
      {wicketModalOpen && (
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
              <h2 style={{ color: 'var(--accent-red)' }}>⚠️ Record Dismissal</h2>
              <button
                onClick={() => setWicketModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWicketSubmit}>
              <div className="form-group mb-4">
                <label className="form-label">Dismissal Type *</label>
                <select
                  className="form-control"
                  value={wicketType}
                  onChange={(e) => setWicketType(e.target.value)}
                >
                  <option value="BOWLED">Bowled</option>
                  <option value="CAUGHT">Caught</option>
                  <option value="LBW">LBW</option>
                  <option value="RUN_OUT">Run Out</option>
                  <option value="STUMPED">Stumped</option>
                  <option value="HIT_WICKET">Hit Wicket</option>
                </select>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Batter Dismissed *</label>
                <select
                  className="form-control"
                  value={dismissedId}
                  onChange={(e) => setDismissedId(e.target.value)}
                >
                  <option value={strikerId}>Striker: {battingPlayers.find(p => p.id === Number(strikerId))?.playerName}</option>
                  <option value={nonStrikerId}>Non-Striker: {battingPlayers.find(p => p.id === Number(nonStrikerId))?.playerName}</option>
                </select>
              </div>

              <div className="form-group mb-6">
                <label className="form-label">Runs Completed on this Ball (e.g. Run Out)</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  className="form-control"
                  value={runsOnWicket}
                  onChange={(e) => setRunsOnWicket(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setWicketModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={submittingBall}>
                  {submittingBall ? 'Recording...' : 'Confirm Wicket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreManagement;
