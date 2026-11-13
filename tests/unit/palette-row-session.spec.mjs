import { describe, expect, it } from 'vitest';
import { PaletteRowSession } from '../../src/editor/shared/palette-section.js';

describe('PaletteRowSession', () => {
  it('keeps drafts and generation for an unchanged ordered snapshot', () => {
    const rows = [{ pos: 0 }, { pos: 40 }, { pos: 100 }];
    const session = new PaletteRowSession();
    session.reconcile(rows);
    session.setDraft(1, 'pos', '42');
    const token = session.tokenAt(1);

    expect(session.reconcile(structuredClone(rows))).toBe(false);
    expect(session.generation).toBe(token.generation);
    expect(session.getDraft(1, 'pos')).toBe('42');
    expect(session.isCurrent(token, 1)).toBe(true);
  });

  it.each([
    ['insertion', [{ pos: 0 }, { pos: 20 }, { pos: 40 }]],
    ['removal', [{ pos: 0 }]],
    ['reordering', [{ pos: 40 }, { pos: 0 }]],
    ['same-count modification', [{ pos: 0 }, { pos: 45 }]],
  ])('ends the session on external %s', (_name, nextRows) => {
    const session = new PaletteRowSession();
    session.reconcile([{ pos: 0 }, { pos: 40 }]);
    session.setDraft(1, 'pos', '42');
    const oldToken = session.tokenAt(1);

    expect(session.reconcile(nextRows)).toBe(true);
    expect(session.generation).toBe(oldToken.generation + 1);
    expect(session.getDraft(1, 'pos')).toBeUndefined();
    expect(session.isCurrent(oldToken, 1)).toBe(false);
    expect(session.takeReplacement()).toBe(true);
    expect(session.takeReplacement()).toBe(false);
  });

  it('records user edits without ending the session', () => {
    const session = new PaletteRowSession();
    session.reconcile([{ pos: 0 }, { pos: 40 }]);
    session.setDraft(1, 'pos', '42');
    const token = session.tokenAt(1);
    const edited = [{ pos: 0 }, { pos: 42 }];

    session.record(edited);
    expect(session.reconcile(edited)).toBe(false);
    expect(session.generation).toBe(token.generation);
    expect(session.getDraft(1, 'pos')).toBe('42');
    expect(session.isCurrent(token, 1)).toBe(true);
  });

  it('owns drafts by position and cancels every draft on replacement', () => {
    const session = new PaletteRowSession();
    session.reconcile([{ from: 0 }, { from: 50 }]);
    session.setDraft(0, 'to', '25');
    session.setDraft(1, 'to', '75');
    expect(session.getDraft(0, 'to')).toBe('25');
    expect(session.getDraft(1, 'to')).toBe('75');

    session.reconcile([{ from: 0 }, { from: 25 }, { from: 50 }]);
    expect(session.drafts.size).toBe(0);
  });

  it('rejects tokens from another scope session', () => {
    const first = new PaletteRowSession();
    first.reconcile([{ pos: 0 }]);
    const token = first.tokenAt(0);
    const second = new PaletteRowSession();
    second.reconcile([{ pos: 0 }]);
    expect(second.isCurrent(token, 0)).toBe(false);
  });
});
