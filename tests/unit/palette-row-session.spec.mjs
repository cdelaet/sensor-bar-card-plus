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
