import { describe, expect, it } from 'vitest';
import { getJwtExpiration, isExpiringSoon } from './jwt';

function makeToken(exp: number): string {
  const payload = btoa(JSON.stringify({ exp }));
  return `header.${payload}.signature`;
}

describe('jwt', () => {
  it('extrae exp del payload', () => {
    const exp = Math.floor(Date.now() / 1000) + 900;
    expect(getJwtExpiration(makeToken(exp))).toBe(exp);
  });

  it('token con 15 min de vida NO está por expirar', () => {
    expect(isExpiringSoon(makeToken(Math.floor(Date.now() / 1000) + 900))).toBe(false);
  });

  it('token con 1 min de vida SÍ está por expirar (margen 2 min)', () => {
    expect(isExpiringSoon(makeToken(Math.floor(Date.now() / 1000) + 60))).toBe(true);
  });

  it('token malformado se trata como expirado', () => {
    expect(isExpiringSoon('no-es-un-jwt')).toBe(true);
  });
});
