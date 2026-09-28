import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Team APIs
export const getTeams = () => api.get('/teams');
export const getTeam = (id) => api.get(`/teams/${id}`);
export const createTeam = (data) => api.post('/teams', data);
export const updateTeam = (id, data) => api.put(`/teams/${id}`, data);
export const deleteTeam = (id) => api.delete(`/teams/${id}`);
export const getTeamPlayers = (teamId) => api.get(`/teams/${teamId}/players`);

// Player APIs
export const getPlayers = () => api.get('/players');
export const getPlayer = (id) => api.get(`/players/${id}`);
export const createPlayer = (data) => api.post('/players', data);
export const updatePlayer = (id, data) => api.put(`/players/${id}`, data);
export const deletePlayer = (id) => api.delete(`/players/${id}`);

// Match APIs
export const getMatches = () => api.get('/matches');
export const getLiveMatches = () => api.get('/matches/live');
export const getMatch = (id) => api.get(`/matches/${id}`);
export const createMatch = (data) => api.post('/matches', data);
export const updateMatch = (id, data) => api.put(`/matches/${id}`, data);
export const deleteMatch = (id) => api.delete(`/matches/${id}`);

// Innings APIs
export const getMatchInnings = (matchId) => api.get(`/matches/${matchId}/innings`);
export const getInnings = (inningsId) => api.get(`/innings/${inningsId}`);
export const startInnings = (matchId, inningsNumber) =>
  api.post(`/matches/${matchId}/innings?inningsNumber=${inningsNumber}`);

// Ball Events
export const getBallEvents = (inningsId) => api.get(`/innings/${inningsId}/balls`);
export const recordBall = (inningsId, data) => api.post(`/innings/${inningsId}/balls`, data);

// Score APIs
export const getMatchScore = (matchId) => api.get(`/matches/${matchId}/score`);
export const getScorecard = (matchId) => api.get(`/matches/${matchId}/scorecard`);
export const getBattingStats = (matchId) => api.get(`/matches/${matchId}/batting`);
export const getBowlingStats = (matchId) => api.get(`/matches/${matchId}/bowling`);
export const getMatchSummary = (matchId) => api.get(`/matches/${matchId}/summary`);

export default api;
