import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { MessageChannel } from 'node:worker_threads';

const source = fs.readFileSync('public/sw.js', 'utf8');
async function click(windows, data) {
  const events = {}, opened = [];
  vm.runInNewContext(source, { URL, MessageChannel, setTimeout, clearTimeout, self: {
    location: { origin: 'https://asofab.test' },
    addEventListener: (name, fn) => { events[name] = fn; },
    clients: { matchAll: async () => windows, openWindow: async url => opened.push(url) },
  } });
  let task;
  events.notificationclick({ notification: { data, close() {} }, waitUntil: promise => { task = promise; } });
  await task;
  return opened;
}
const order = [];
const client = { url: 'https://asofab.test/chapters', focus: async () => order.push('focus'), postMessage: (data, ports) => { order.push(data.url); ports[0].postMessage('navigated'); ports[0].close(); }, navigate: async () => { throw Error('Should use the app router'); } };
assert.deepEqual(await click([client], { notificationId: 'raven-1', url: '/wrong' }), []);
assert.deepEqual(order, ['focus', 'https://asofab.test/notifications?open=raven-1']);
assert.deepEqual(await click([], { url: '/notifications?open=older-raven' }), ['https://asofab.test/notifications?open=older-raven']);
const stale = { url: 'https://asofab.test/', focus: async () => { throw Error('Window closed'); } };
assert.deepEqual(await click([stale], { notificationId: 'raven-2' }), ['https://asofab.test/notifications?open=raven-2']);
let fallback;
await click([{ url: client.url, focus: async () => {}, postMessage: () => {}, navigate: async url => { fallback = url; return {}; } }], { notificationId: 'old-worker' });
assert.equal(fallback, 'https://asofab.test/notifications?open=old-worker');
assert.deepEqual(await click([], { url: 'https://untrusted.test/' }), ['https://asofab.test/notifications']);
console.log('Notification click: awake app handshake, deep links, cold start, stale client and legacy navigation fallback passed.');
