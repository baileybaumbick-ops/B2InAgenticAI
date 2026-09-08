import { describe, it, expect } from 'vitest';
import { validateContact } from '../src/middleware/validateContact.js';

// Pure unit tests of the backend validation middleware — the "backend validation" rubric
// requirement. Deliberately does not go through the Data API/network layer: that boundary
// is verified manually against the deployed app (README's two-account isolation check).

function run(body, opts = { requireName: true }) {
  const req = { body };
  const res = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
  let nextCalled = false;
  validateContact(opts)(req, res, () => {
    nextCalled = true;
  });
  return { req, res, nextCalled };
}

describe('validateContact middleware', () => {
  it('rejects a missing name on create with a clear error message', () => {
    const { res, nextCalled } = run({ priority: 'high' });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.payload.error).toMatch(/name/i);
  });

  it('rejects a blank/whitespace-only name', () => {
    const { res, nextCalled } = run({ name: '   ' });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.payload.error).toMatch(/name/i);
  });

  it('rejects a priority outside high/medium/low with a clear error message', () => {
    const { res, nextCalled } = run({ name: 'Ada Lovelace', priority: 'urgent' });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.payload.error).toMatch(/priority/i);
  });

  it('accepts a valid payload and calls next()', () => {
    const { res, nextCalled } = run({ name: 'Ada Lovelace', company: 'Analytical Engines', priority: 'high' });
    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeNull();
  });

  it('strips a client-supplied user_id (ownership is never client-controlled)', () => {
    const { req, nextCalled } = run({ name: 'Ada Lovelace', user_id: 'someone-elses-id' });
    expect(nextCalled).toBe(true);
    expect(req.body.user_id).toBeUndefined();
  });

  it('does not require a name on edit unless one is supplied', () => {
    const { nextCalled } = run({ priority: 'low' }, { requireName: false });
    expect(nextCalled).toBe(true);
  });

  it('still validates the name on edit if one is supplied', () => {
    const { res, nextCalled } = run({ name: '' }, { requireName: false });
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
  });
});
