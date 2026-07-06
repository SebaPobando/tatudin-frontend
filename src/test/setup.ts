import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Sin `globals: true`, RTL no puede registrar su auto-cleanup:
// lo hacemos explícito para que cada test parta con DOM limpio.
afterEach(cleanup);
