import { describe, expect, it } from 'vitest';
import { PaletteRowSession } from '../../src/editor/shared/palette-section.js';

describe('PaletteRowSession', () => {
  it('keeps authored identities through insertion, removal, and reorder', () => {
    const session = new PaletteRowSession();
    const [a, b, c] = session.reconcile([{ pos: 0 }, { pos: 40 }, { pos: 100 }]);
    expect(session.reconcile([{ pos: 0 }, { pos: 20 }, { pos: 40 }, { pos: 100 }])).toEqual([a, expect.any(String), b, c]);
    expect(session.reconcile([{ pos: 100 }, { pos: 0 }, { pos: 40 }])).toEqual([c, a, b]);
    expect(session.reconcile([{ pos: 100 }, { pos: 40 }])).toEqual([c, b]);
  });

  it('uses occurrence order for duplicates and does not claim to distinguish them', () => {
    const session = new PaletteRowSession();
    const [first, second] = session.reconcile([{ pos: 20, color: 'red' }, { pos: 20, color: 'red' }]);
    expect(session.reconcile([{ pos: 20, color: 'red' }, { pos: 20, color: 'red' }])).toEqual([first, second]);
    expect(session.reconcile([{ pos: 20, color: 'red' }])).toEqual([first]);
  });

  it('bounds stale tokens to the source revision', () => {
    const session = new PaletteRowSession();
    session.reconcile([{ pos: 0 }, { pos: 100 }]);
    const token = session.tokenAt(1);
    expect(session.isCurrent(token, 1)).toBe(true);
    session.reconcile([{ pos: 100 }]);
    expect(session.isCurrent(token, 0)).toBe(false);
  });

  it('keeps the edited row identity while advancing its session revision', () => {
    const session = new PaletteRowSession();
    const [first, second] = session.reconcile([{ pos: 0 }, { pos: 100 }]);
    const token = session.tokenAt(1);
    session.updateAt(1, { pos: 90 });
    expect(session.reconcile([{ pos: 0 }, { pos: 90 }])).toEqual([first, second]);
    expect(session.isCurrent(token, 1)).toBe(false);
    expect(session.idAt(1)).toBe(second);
  });

  it('allocates unique fresh IDs after editing and reinserting the original gradient row', () => {
    const session = new PaletteRowSession();
    const initial = [{ pos: 0, color: 'red' }, { pos: 40, color: 'green' }, { pos: 100, color: 'blue' }];
    const [redId, greenId, blueId] = session.reconcile(initial);
    session.updateAt(1, { pos: 45, color: 'green' });
    const rows = [{ pos: 0, color: 'red' }, { pos: 45, color: 'green' }, { pos: 100, color: 'blue' }];
    expect(session.reconcile(rows)[1]).toBe(greenId);

    const inserted = [rows[0], initial[1], rows[1], rows[2]];
    const ids = session.reconcile(inserted);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([redId, expect.not.stringMatching(/^$/), greenId, blueId]);
    expect(ids[1]).not.toBe(greenId);
    session.setDraft(2, 'pos', '42');
    expect(session.getDraft(2, 'pos')).toBe('42');
    expect(session.getDraft(1, 'pos')).toBeUndefined();

    expect(session.reconcile(inserted)).toEqual(ids);
    expect(new Set(session.rows.map(({ id }) => id)).size).toBe(inserted.length);
    expect(session.getDraft(2, 'pos')).toBe('42');
    expect(session.getDraft(1, 'pos')).toBeUndefined();
  });

  it('does not reuse IDs for edited and reinserted segment content', () => {
    const session = new PaletteRowSession(row => JSON.stringify({ from: row.from }));
    const initial = [
      { from: 0, to: 40, color: 'red' },
      { from: 40, to: 70, color: 'green' },
      { from: 70, to: 100, color: 'blue' },
    ];
    const [redId, greenId, blueId] = session.reconcile(initial);
    session.updateAt(1, { from: 45, to: 70, color: 'green' });
    const edited = [initial[0], { from: 45, to: 70, color: 'green' }, initial[2]];
    expect(session.reconcile(edited)[1]).toBe(greenId);

    const ids = session.reconcile([initial[0], initial[1], edited[1], initial[2]]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe(redId);
    expect(ids[2]).toBe(greenId);
    expect(ids[3]).toBe(blueId);
    expect(ids[1]).not.toBe(greenId);
    session.setDraft(2, 'to', '72');
    expect(session.reconcile([initial[2], initial[0], initial[1], edited[1]])).toEqual([blueId, redId, ids[1], greenId]);
    expect(new Set(session.rows.map(({ id }) => id)).size).toBe(4);
    expect(session.getDraft(3, 'to')).toBe('72');
    expect(session.getDraft(2, 'to')).toBeUndefined();
  });

  it('keeps IDs unique with equal-content rows across repeated insertion and removal', () => {
    const session = new PaletteRowSession();
    const duplicate = { pos: 40, color: 'green' };
    const first = session.reconcile([duplicate, duplicate, duplicate]);
    expect(new Set(first).size).toBe(3);
    session.setDraft(0, 'pos', '42');
    session.setDraft(2, 'pos', '43');
    session.reconcile([duplicate, duplicate]);
    expect(session.drafts.size).toBe(0);
    const afterInsert = session.reconcile([duplicate, duplicate, duplicate]);
    expect(new Set(afterInsert).size).toBe(3);
    expect(afterInsert.slice(0, 2)).toEqual(first.slice(0, 2));
    expect(afterInsert[2]).not.toBe(first[2]);
    expect(session.reconcile([duplicate, duplicate])).toEqual(afterInsert.slice(0, 2));
  });

  it('uses an unambiguous secondary anchor and invalidates ambiguous duplicate anchors', () => {
    const session = new PaletteRowSession(row => JSON.stringify({ from: row.from }));
    const [red, green] = session.reconcile([
      { from: 10, to: 30, color: 'red' }, { from: 10, to: 60, color: 'green' },
    ]);
    session.setDraft(0, 'to', '25');
    expect(session.reconcile([
      { from: 10, to: 60, color: 'green' }, { from: 10, to: 25, color: 'red' },
    ])).toEqual([green, red]);
    expect(session.getDraft(1, 'to')).toBe('25');

    const ambiguous = new PaletteRowSession(row => JSON.stringify({ from: row.from }));
    const oldIds = ambiguous.reconcile([
      { from: 10, to: 30, color: 'red' }, { from: 10, to: 60, color: 'green' },
    ]);
    ambiguous.setDraft(0, 'to', '25');
    const newIds = ambiguous.reconcile([
      { from: 10, to: 25, color: 'red' }, { from: 10, to: 75, color: 'green' },
    ]);
    expect(newIds.some(id => oldIds.includes(id))).toBe(false);
    expect(ambiguous.drafts.size).toBe(0);
  });

  it('gives replacement sessions a fresh event revision', () => {
    const first = new PaletteRowSession();
    first.reconcile([{ pos: 0 }]);
    const token = first.tokenAt(0);
    const replacement = new PaletteRowSession();
    replacement.reconcile([{ pos: 0 }]);
    expect(replacement.revision).not.toBe(token.revision);
  });

  it('owns field drafts by logical row and prunes removed rows', () => {
    const session = new PaletteRowSession();
    const [first, second] = session.reconcile([{ from: 0 }, { from: 50 }]);
    session.setDraft(1, 'to', '7');
    session.reconcile([{ from: 0 }, { from: 25 }, { from: 50 }]);
    expect(session.getDraft(2, 'to')).toBe('7');
    session.reconcile([{ from: 0 }, { from: 25 }]);
    expect(session.drafts.has(second)).toBe(false);
    expect(session.drafts.has(first)).toBe(false);
  });
});
