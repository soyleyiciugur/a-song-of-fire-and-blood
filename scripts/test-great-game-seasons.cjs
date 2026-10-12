require('./test-great-game-decks.cjs');
const assert = require('node:assert/strict');
const { currentSeason, seasonPeriod, seasonDisplayName, seasonStandings } = require('../lib/the-great-game/seasons.ts');

const seasons = [
  { id: 'alpha', stage: 'Alpha', name: 'The First Embers', status: 'active', started_at: '2026-10-09T00:00:00+03:00', ended_at: null },
  { id: 'beta', stage: 'Beta', name: 'The Gathering Storm', status: 'planned', started_at: null, ended_at: null },
];
assert.equal(currentSeason(seasons)?.id, 'alpha');
assert.equal(seasonDisplayName(seasons[0]), 'Alpha Season — The First Embers');
assert.equal(seasonPeriod(seasons, 'alpha')?.id, 'alpha');
assert.equal(seasonPeriod(seasons, 'beta'), null, 'A planned future season must not be publicly selectable');
assert.equal(seasonPeriod(seasons, 'missing'), null);
assert.equal(currentSeason([{ ...seasons[0], status: 'closed', ended_at: '2027-01-01' }, seasons[1]]), null,
  'The calendar must never start Beta');
assert.equal(currentSeason([{ ...seasons[0], status: 'closed' }, { ...seasons[1], status: 'active', started_at: '2027-01-01' }])?.id, 'beta');
const row = (id, result, delta, match_type='ranked') => ({ user_id: id, result, rating_before: 1000, rating_after: 1000 + delta, match_type });
const rows = [row('a', 'win', 20), row('a', 'abandon', -10), row('b', 'win', 10), row('c', 'draw', 0), row('d', 'loss', -10), row('b', 'win', 500, 'custom')];
const original = JSON.stringify(rows);
const board = seasonStandings(rows);
assert.deepEqual(board.map(p => p.rank), [1, 1, 3, 4]);
assert.equal(board.find(p => p.userId === 'b').points, 10, 'Custom matches never count toward a season');
assert.equal(board[0].losses, 1);
assert.equal(board[0].games, 2);
assert.equal(board[2].draws, 1);
assert.equal(JSON.stringify(rows), original, 'Standings must not mutate match results');
console.log('PASS explicit Alpha/Beta season lifecycle, no scheduled transition, ranked-only standings, ties and immutable results');
