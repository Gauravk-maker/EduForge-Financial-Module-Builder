
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.hoisted(() =>
  vi.fn(() => ({ auth: {} })),
);

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

describe('Supabase configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates a client when valid credentials are provided', async () => {
    const url = 'https://example.supabase.co';
    const key = 'test-publishable-key';

    vi.stubEnv('VITE_SUPABASE_URL', url);
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', key);

    const { supabase, isSupabaseConfigured } = await import('./supabase');

    expect(isSupabaseConfigured).toBe(true);
    expect(supabase).not.toBeNull();
    expect(createClientMock).toHaveBeenCalledWith(
      url,
      key,
      expect.objectContaining({
        auth: expect.objectContaining({
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        }),
      }),
    );
  });

  it('does not create a client when the URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');

    const { supabase, isSupabaseConfigured } = await import('./supabase');

    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('does not create a client when the key is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    const { supabase, isSupabaseConfigured } = await import('./supabase');

    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('rejects placeholder credentials', async () => {
    vi.stubEnv(
      'VITE_SUPABASE_URL',
      'https://YOUR_PROJECT_ID.supabase.co',
    );
    vi.stubEnv(
      'VITE_SUPABASE_ANON_KEY',
      'YOUR_SUPABASE_ANON_KEY',
    );

    const { supabase, isSupabaseConfigured } = await import('./supabase');

    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
