import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../App', () => ({
  default: () => <div>Builder app</div>,
}));

vi.mock('../lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));

describe('AuthGate', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_E2E_BYPASS_AUTH', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders the builder when auth bypass is enabled', async () => {
    const { default: AuthGate } = await import('./AuthGate');

    render(<AuthGate />);

    expect(screen.getByText('Builder app')).toBeVisible();
    expect(screen.queryByText('Supabase setup required')).not.toBeInTheDocument();
  });
});
