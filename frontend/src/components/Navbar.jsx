import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      backgroundColor: 'rgba(10, 14, 26, 0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
      }}>
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--text-primary)',
          textDecoration: 'none'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3182ce, #805ad5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 800,
            boxShadow: '0 0 15px rgba(99,179,237,0.35)'
          }}>
            🏏
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              lineHeight: 1.1,
              color: '#fff'
            }}>
              CRIC<span style={{ color: 'var(--accent-blue)' }}>PULSE</span>
            </div>
            <div style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase'
            }}>
              Real-time Score Engine
            </div>
          </div>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
              color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99,179,237,0.1)' : 'transparent'
            })}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/live"
            style={({ isActive }) => ({
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: isActive ? '#fc8181' : 'var(--text-secondary)',
              background: isActive ? 'rgba(252,79,79,0.12)' : 'transparent'
            })}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#fc4f4f',
              display: 'inline-block',
              animation: 'blink 1.5s infinite'
            }} />
            Live Matches
          </NavLink>

          <NavLink
            to="/teams"
            style={({ isActive }) => ({
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
              color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99,179,237,0.1)' : 'transparent'
            })}
          >
            Teams
          </NavLink>

          <NavLink
            to="/players"
            style={({ isActive }) => ({
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
              color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99,179,237,0.1)' : 'transparent'
            })}
          >
            Players
          </NavLink>

          <Link
            to="/score-management"
            className="btn btn-primary btn-sm"
            style={{ marginLeft: '12px' }}
          >
            ⚡ Live Scorer
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
