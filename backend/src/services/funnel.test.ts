import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearFunnelMemory,
  getFunnelReport,
  recordEvents,
  setFunnelMemory,
} from './funnel';

setFunnelMemory(true);

async function session(id: string, events: Array<[string, number]>): Promise<void> {
  await recordEvents(
    `device-${id}`,
    id,
    events.map(([name, atMs]) => ({ name: name as never, atMs })),
  );
}

describe('funnel report (memory)', () => {
  beforeEach(() => {
    clearFunnelMemory();
  });

  it('reports zeroes with no events', async () => {
    const report = await getFunnelReport();
    assert.equal(report.steps[0]?.sessions, 0);
    assert.equal(report.steps[0]?.reachedPct, 0);
    assert.equal(report.timeToFirstChoiceMs.samples, 0);
    assert.equal(report.timeToFirstChoiceMs.median, null);
  });

  it('counts distinct sessions per step and derives drop-off', async () => {
    await session('session-0001', [
      ['app_open', 300],
      ['name_focused', 2000],
      ['awaken_submitted', 6000],
      ['awaken_complete', 9000],
      ['first_choice', 15000],
    ]);
    await session('session-0002', [
      ['app_open', 400],
      ['name_focused', 3000],
    ]);
    await session('session-0003', [['app_open', 500]]);
    await session('session-0004', [['app_open', 600]]);

    const report = await getFunnelReport();
    const byName = new Map(report.steps.map((s) => [s.name, s]));

    assert.equal(byName.get('app_open')?.sessions, 4);
    assert.equal(byName.get('name_focused')?.sessions, 2);
    assert.equal(byName.get('name_focused')?.reachedPct, 50);
    // Half of the players who opened the app never touched the name field.
    assert.equal(byName.get('name_focused')?.dropPct, 50);
    assert.equal(byName.get('awaken_submitted')?.sessions, 1);
    assert.equal(byName.get('awaken_submitted')?.dropPct, 50);
    assert.equal(byName.get('turn_5')?.sessions, 0);
  });

  it('is idempotent per session and event', async () => {
    await session('session-dupe-1', [['app_open', 100]]);
    await session('session-dupe-1', [['app_open', 9999]]);

    const report = await getFunnelReport();
    assert.equal(report.steps[0]?.sessions, 1);
  });

  it('keeps the first timestamp when an event is resent', async () => {
    await session('session-time-1', [
      ['app_open', 100],
      ['first_choice', 12000],
    ]);
    await session('session-time-1', [['first_choice', 99000]]);

    const report = await getFunnelReport();
    assert.equal(report.timeToFirstChoiceMs.median, 12000);
  });

  it('summarises time to first choice as median and p90', async () => {
    const timings = [8000, 9000, 10000, 11000, 40000];
    for (const [index, atMs] of timings.entries()) {
      await session(`session-ttfc-${index}`, [
        ['app_open', 200],
        ['first_choice', atMs],
      ]);
    }

    const report = await getFunnelReport();
    assert.equal(report.timeToFirstChoiceMs.samples, 5);
    assert.equal(report.timeToFirstChoiceMs.median, 10000);
    assert.equal(report.timeToFirstChoiceMs.p90, 40000);
  });

  it('counts skip signals separately from the ordered steps', async () => {
    await session('session-skip-1', [
      ['app_open', 100],
      ['intro_skipped', 900],
      ['eyes_skipped', 4000],
    ]);

    const report = await getFunnelReport();
    const signals = new Map(report.signals.map((s) => [s.name, s.sessions]));
    assert.equal(signals.get('intro_skipped'), 1);
    assert.equal(signals.get('eyes_skipped'), 1);
    assert.equal(signals.get('story_skipped'), 0);
    assert.ok(!report.steps.some((s) => s.name === 'intro_skipped'));
  });
});
