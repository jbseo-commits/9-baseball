import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { Window } from 'happy-dom';

const html = fs.readFileSync(new URL('../../../public/ui-lab/director-card/index.html', import.meta.url), 'utf8');
function fixture(t, options = {}) {
  const w = new Window({ settings: { disableJavaScriptEvaluation: false } });
  w.matchMedia = () => ({ matches: true });
  w.Element.prototype.animate = () => ({});
  w.document.write(html);
  const scripts = [...w.document.querySelectorAll('script')];
  w.eval(scripts[0].textContent);
  if ('zoneOverride' in options) {
    const original = w.DUEL.playV10Action;
    w.DUEL.playV10Action = (...args) => {
      const after = original(...args);
      return { ...after, battle: { ...after.battle, revealed: { ...after.battle.revealed, zone: options.zoneOverride } } };
    };
  }
  w.eval(scripts[1].textContent);
  const $ = selector => w.document.querySelector(selector);
  const $$ = selector => [...w.document.querySelectorAll(selector)];
  const root = $('#director-nine');
  root.setPointerCapture = () => {};
  root.hasPointerCapture = () => false;
  function geometry() {
    $('.dn-game').getBoundingClientRect = () => ({ left: 0, top: 0 });
    $$('.dn-zone').forEach((el, z) => {
      el.getBoundingClientRect = () => ({ left: 130 + z % 3 * 56, right: 186 + z % 3 * 56, top: 220 + Math.floor(z / 3) * 56, bottom: 276 + Math.floor(z / 3) * 56 });
    });
  }
  function event(el, type, x, y, pointerType = 'mouse', pointerId = 7) {
    geometry();
    el.dispatchEvent(new w.PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId, pointerType }));
  }
  function drag(el, z, { cancel = false, outside = false, pointerType = 'mouse' } = {}) {
    event(el, 'pointerdown', 150, 490, pointerType);
    event(root, 'pointermove', 150, 460, pointerType);
    const x = outside ? 30 : 158 + z % 3 * 56;
    const y = outside ? 180 : 248 + Math.floor(z / 3) * 56;
    event(root, 'pointermove', x, y, pointerType);
    event(root, cancel ? 'pointercancel' : 'pointerup', x, y, pointerType);
  }
  const snapshot = () => ({
    name: $('.dn-name').textContent,
    aim: $('.dn-zone.primary')?.dataset.zone,
    energy: $('.dn-energy b').textContent,
    hp: $('[data-hp]').textContent,
    hand: $('[data-hand-count]').textContent,
    supports: $$('.dn-support img').length,
  });
  t.after(() => w.happyDOM.abort());
  return { w, $, $$, root, event, drag, snapshot };
}
async function resolved(f) {
  for (let i = 0; i < 100 && !f.$('.dn-game.resolved'); i++) await new Promise(r => setTimeout(r, 10));
  assert.ok(f.$('.dn-game.resolved'), 'engine action must resolve');
}

test('standalone scripts parse and have no host/network/path placeholders', () => {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 2);
  scripts.forEach(([, script]) => new vm.Script(script));
  assert.ok(Buffer.byteLength(html) < 1_000_000);
  assert.doesNotMatch(html, /window\.openai|openai:set_globals|data-lucide|__ASSET_|__ENGINE_|C:[/\\]Users|\bfetch\s*\(|XMLHttpRequest|WebSocket\s*\(/);
});

for (const pointerType of ['mouse', 'touch']) {
  test(`${pointerType}: upward main-card drop selects and aims without consuming resources`, t => {
    const f = fixture(t), before = f.snapshot();
    f.drag(f.$$('.dn-card-main')[1], 6, { pointerType });
    assert.equal(f.snapshot().name, '밀어치기');
    assert.equal(f.snapshot().aim, '6');
    assert.equal(f.$$('.dn-zone.covered').length, 3);
    assert.deepEqual([f.snapshot().energy, f.snapshot().hp, f.snapshot().hand], [before.energy, before.hp, before.hand]);
    assert.ok(f.$('.dn-drag-ghost').hidden);
  });
  test(`${pointerType}: outside drop and pointercancel preserve plan/resources`, t => {
    const f = fixture(t), before = f.snapshot();
    f.drag(f.$$('.dn-card-main')[1], 3, { outside: true, pointerType });
    assert.deepEqual(f.snapshot(), before);
    f.drag(f.$$('.dn-card-main')[1], 3, { cancel: true, pointerType });
    assert.deepEqual(f.snapshot(), before);
    assert.ok(!f.$('.dn-game.dragging'));
  });
}

test('horizontal intention stays out of aiming and ordinary card taps still select', t => {
  const f = fixture(t), before = f.snapshot(), card = f.$$('.dn-card-main')[1];
  f.event(card, 'pointerdown', 150, 490, 'touch');
  f.event(f.root, 'pointermove', 90, 486, 'touch');
  f.event(f.root, 'pointerup', 80, 485, 'touch');
  assert.deepEqual(f.snapshot(), before);
  assert.ok(f.$('.dn-drag-ghost').hidden);
  card.click();
  assert.equal(f.snapshot().name, '밀어치기');
});

test('touch capture transfer from card to root does not cancel an active drag', t => {
  const f = fixture(t), card = f.$$('.dn-card-main')[1];
  f.event(card, 'pointerdown', 150, 490, 'touch');
  f.event(f.root, 'pointermove', 150, 460, 'touch');
  f.event(card, 'lostpointercapture', 150, 460, 'touch');
  assert.ok(f.$('.dn-game.dragging'));
  f.event(f.root, 'pointerup', 158, 360, 'touch');
  assert.equal(f.snapshot().name, '밀어치기');
  assert.equal(f.snapshot().aim, '6');
});

test('root capture loss cancels without changing resources or plan', t => {
  const f = fixture(t), before = f.snapshot();
  f.event(f.$$('.dn-card-main')[1], 'pointerdown', 150, 490, 'touch');
  f.event(f.root, 'pointermove', 150, 460, 'touch');
  f.event(f.root, 'lostpointercapture', 150, 460, 'touch');
  assert.ok(!f.$('.dn-game.dragging'));
  assert.deepEqual(f.snapshot(), before);
});

test('Escape cancellation also suppresses the release click', t => {
  const f = fixture(t), before = f.snapshot();
  f.event(f.$$('.dn-card-main')[1], 'pointerdown', 150, 490);
  f.event(f.root, 'pointermove', 150, 460);
  f.root.dispatchEvent(new f.w.KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
  f.$$('.dn-zone')[6].dispatchEvent(new f.w.PointerEvent('click', { bubbles: true, cancelable: true, pointerId: 7, detail: 1 }));
  assert.deepEqual(f.snapshot(), before);
});

test('leaving the product before drag activation clears the pending pointer', t => {
  const f = fixture(t), before = f.snapshot();
  f.event(f.$$('.dn-card-main')[1], 'pointerdown', 150, 490);
  f.event(f.root, 'pointerleave', 150, 700);
  f.event(f.root, 'pointermove', 158, 360);
  f.event(f.root, 'pointerup', 158, 360);
  assert.deepEqual(f.snapshot(), before);
});

test('support drop preserves main/aim, suppresses synthetic click, rejects duplicate and basic support', t => {
  const f = fixture(t), before = f.snapshot();
  f.drag(f.$$('.dn-card-support')[1], 5);
  assert.equal(f.snapshot().supports, 1);
  assert.equal(f.snapshot().name, before.name);
  assert.equal(f.snapshot().aim, before.aim);
  const linked = f.$$('.dn-card-support')[1];
  linked.dispatchEvent(new f.w.PointerEvent('click', { bubbles: true, cancelable: true, pointerId: 7, detail: 1 }));
  assert.ok(!f.$('.dn-game.arming'), 'drop click cannot arm the card again');
  f.drag(linked, 4);
  assert.equal(f.snapshot().supports, 1);
  f.$('.dn-basic').click();
  const basic = f.snapshot();
  f.drag(f.$$('.dn-card-support')[1], 4);
  assert.deepEqual(f.snapshot(), basic);
  assert.equal(f.$$('.dn-support:disabled').length, 3);
});

test('take reveals actual landing only after resolution and next pitch clears the record', async t => {
  const f = fixture(t);
  assert.ok(f.$('.dn-replay').hidden);
  assert.equal(f.$$('.dn-replay .landed').length, 0);
  f.$('.dn-take').click();
  assert.ok(f.$('.dn-replay').hidden, 'no landing during wind-up');
  await resolved(f);
  assert.ok(!f.$('.dn-replay').hidden);
  assert.match(f.$('.dn-replay').textContent, /지켜봄/);
  assert.equal(f.$$('.dn-replay .covered').length, 0);
  assert.ok(f.$$('.dn-replay .landed').length <= 1);
  f.$('.dn-execute').click();
  assert.ok(f.$('.dn-replay').hidden);
  assert.ok(!f.$('.dn-game.resolved'));
});

test('result keeps planned coverage and engine verdict; details do not cover next action', async t => {
  const f = fixture(t);
  f.$$('.dn-card-main')[1].click();
  f.$$('.dn-zone')[6].click();
  const covered = f.$$('.dn-zone.covered').map(el => +el.dataset.zone);
  f.$('.dn-information').click();
  assert.equal(f.$('.dn-information').getAttribute('aria-expanded'), 'true');
  f.$('.dn-execute').click();
  assert.ok(f.$('.dn-details').hidden);
  await resolved(f);
  assert.deepEqual(f.$$('.dn-replay-grid>i').flatMap((el, z) => el.classList.contains('covered') ? [z] : []), covered);
  assert.equal(f.$$('.dn-replay .aim').length, 1);
  assert.match(f.$('.dn-replay-grid').getAttribute('aria-label'), /실제 착탄/);
  assert.ok(f.$('.dn-result h3').textContent.length > 0);
  assert.equal(f.$('.dn-execute').disabled, false);
});

test('preparation stays in this pitch and never creates a landing record', async t => {
  const f = fixture(t);
  f.$$('.dn-card-main')[3].click();
  f.$('.dn-execute').click();
  assert.ok(!f.$('.dn-game.resolved'));
  assert.ok(f.$('.dn-replay').hidden);
  assert.equal(f.snapshot().energy, '2');
  assert.equal(f.$$('.dn-zone').length, 9);
});

for (const zone of [null, undefined, -1, 0]) {
  test(`landing record edge value ${String(zone)} is not coerced to a different zone`, async t => {
    const f = fixture(t, { zoneOverride: zone });
    f.$('.dn-take').click();
    await resolved(f);
    assert.equal(f.$$('.dn-replay .landed').length, zone === 0 ? 1 : 0);
    assert.match(f.$('.dn-replay-grid').getAttribute('aria-label'), zone === 0 ? /몸쪽 높은 공/ : /존 밖/);
  });
}
