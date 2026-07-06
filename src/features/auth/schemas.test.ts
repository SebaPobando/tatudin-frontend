import { describe, expect, it } from 'vitest';
import { loginSchema } from './schemas';

describe('loginSchema', () => {
  it('acepta credenciales válidas', () => {
    expect(loginSchema.safeParse({ email: 'scar@tatudin.com', password: 'x' }).success).toBe(true);
  });

  it('rechaza email inválido', () => {
    const result = loginSchema.safeParse({ email: 'no-es-email', password: 'x' });
    expect(result.success).toBe(false);
  });

  it('rechaza contraseña vacía', () => {
    const result = loginSchema.safeParse({ email: 'scar@tatudin.com', password: '' });
    expect(result.success).toBe(false);
  });
});
