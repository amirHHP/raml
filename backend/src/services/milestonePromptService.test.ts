import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  deleteMilestonePrompt,
  ensureMilestoneSeeds,
  getMilestonePromptBody,
  isMilestoneTurn,
  listMilestonePrompts,
  setMilestonePromptMemory,
  upsertMilestonePrompt,
  withMilestonePrompt,
} from './milestonePromptService';

describe('milestone prompts', () => {
  before(async () => {
    setMilestonePromptMemory(true);
    await ensureMilestoneSeeds();
  });

  it('recognizes every-10 turns', () => {
    assert.equal(isMilestoneTurn(10), true);
    assert.equal(isMilestoneTurn(20), true);
    assert.equal(isMilestoneTurn(7), false);
    assert.equal(isMilestoneTurn(0), false);
  });

  it('seeds stage 10 backpack directive', async () => {
    const body = await getMilestonePromptBody(10);
    assert.ok(body);
    assert.match(body!, /discovered_item|کوله‌پشتی|آیتم/);
  });

  it('seeds milestones through stage 100', async () => {
    const listed = await listMilestonePrompts();
    const turns = listed.map((m) => m.turn);
    for (let t = 10; t <= 100; t += 10) {
      assert.ok(turns.includes(t), `missing milestone ${t}`);
    }
    assert.ok((await getMilestonePromptBody(100))?.includes('discovered_item'));
  });

  it('appends milestone only on matching turns', async () => {
    const base = 'پرامپت عادی';
    const plain = await withMilestonePrompt(base, 9);
    assert.equal(plain, base);

    const withMs = await withMilestonePrompt(base, 10);
    assert.match(withMs, /پرامپت عادی/);
    assert.match(withMs, /مرحله 10/);
    assert.match(withMs, /discovered_item|کوله‌پشتی|آیتم/);
  });

  it('upserts and lists custom milestones', async () => {
    await upsertMilestonePrompt(110, 'در مرحله ۱۱۰ با یک دشمن روبه‌رو شو.');
    const listed = await listMilestonePrompts();
    assert.ok(listed.some((m) => m.turn === 110 && m.body.includes('دشمن')));

    await deleteMilestonePrompt(110);
    const after = await listMilestonePrompts();
    assert.equal(after.some((m) => m.turn === 110), false);
  });

  it('rejects non-interval turns', async () => {
    await assert.rejects(() => upsertMilestonePrompt(15, 'bad'), (err: Error & { status?: number }) => {
      assert.equal(err.status, 400);
      return true;
    });
  });
});
