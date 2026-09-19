import assert from 'node:assert/strict';

export function validateCommunitySchedule(schedule) {
  assert.equal(schedule.timeZone, 'Europe/Istanbul');
  assert.equal(new Set(schedule.slots.map(s => s.id)).size, schedule.slots.length);
  assert.equal(new Set(schedule.slots.map(s => s.publishedAt)).size, schedule.slots.length);
  assert.deepEqual(schedule.policy, {
    windowHours: 24,
    responsesPerHour: 1,
    randomMinute: true,
    persisted: true,
    releaseStages: [
      { id: 'launch', minOffsetMinutes: 0, maxOffsetMinutes: 0, targetSharePercent: 40 },
      { id: 'half-hour', minOffsetMinutes: 1, maxOffsetMinutes: 30, targetSharePercent: 20 },
      { id: 'two-hour', minOffsetMinutes: 31, maxOffsetMinutes: 120, targetSharePercent: 15 },
      { id: 'five-hour', minOffsetMinutes: 121, maxOffsetMinutes: 300, targetSharePercent: 10 },
      { id: 'ten-hour', minOffsetMinutes: 301, maxOffsetMinutes: 600, targetSharePercent: 5 },
      { id: 'twenty-four-hour', minOffsetMinutes: 601, maxOffsetMinutes: 1440, targetSharePercent: 5 },
      { id: 'seventy-two-hour', minOffsetMinutes: 1441, maxOffsetMinutes: 4320, targetSharePercent: 5 },
    ],
  });
  const active = schedule.slots.filter(s => s.batchId === schedule.currentBatchId);
  assert.equal(active.length, 24, 'Current batch covers 24 hours');
  const hours = active.map(s => Math.floor(Date.parse(s.publishedAt) / 3600000)).sort((a,b) => a-b);
  for (let i=0; i<24; i++) assert.equal(hours[i], hours[0]+i, 'One window in every consecutive hour');
  assert(new Set(active.map(s => new Date(s.publishedAt).getUTCMinutes())).size > 1, 'Vary publication minutes');
  for (const slot of schedule.slots) {
    assert(Number.isFinite(Date.parse(slot.publishedAt)), `Invalid timestamp: ${slot.id}`);
    for (const key of ['commentIds', 'forumThreadIds', 'forumCommentIds']) assert(Array.isArray(slot[key]));
    if (slot.batchId === schedule.currentBatchId) {
      assert(new Date(slot.publishedAt).getUTCMinutes() !== 0, 'Avoid top-of-hour publication');
      assert(slot.commentIds.length + slot.forumCommentIds.length >= 1, 'Every hourly window has a response');
    }
  }
}
