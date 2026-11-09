import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    result: {
      data: null as unknown,
      error: null as { message: string } | null,
    },
  };

  const chain = {
    upsert: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    delete: vi.fn(),
  };

  const supabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => chain),
  };

  return { state, chain, supabase, validateModule: vi.fn() };
});

vi.mock('./supabase', () => ({
  supabase: mocks.supabase,
  isSupabaseConfigured: true,
}));

vi.mock('./document', () => ({
  validateModule: mocks.validateModule,
}));

import { saveModuleToCloud, getMyCloudModules, deleteCloudModule } from './moduleStorage';

import type { ModuleDocument } from '../types';

const testDocument = {
  moduleId: 'module-123',
  title: 'Test Financial Module',
  description: 'Test description',
} as ModuleDocument;

const user = { id: 'user-123' };

describe('Module cloud storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.state.result = { data: null, error: null };
    mocks.validateModule.mockReturnValue([]);

    mocks.supabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    });

    mocks.chain.upsert.mockResolvedValue({ error: null });
    mocks.chain.select.mockReturnValue(mocks.chain);
    mocks.chain.eq.mockReturnValue(mocks.chain);
    mocks.chain.order.mockImplementation(async () => mocks.state.result);

    mocks.chain.delete.mockReturnValue(mocks.chain);

    mocks.chain.eq.mockReturnValue(mocks.chain);
    mocks.chain.eq.mockImplementation(() => mocks.chain);
  });

  describe('saveModuleToCloud', () => {
    it('saves a valid module successfully', async () => {
      await expect(saveModuleToCloud(testDocument)).resolves.toBeUndefined();

      expect(mocks.validateModule).toHaveBeenCalledWith(testDocument);
      expect(mocks.supabase.from).toHaveBeenCalledWith('financial_modules');
      expect(mocks.chain.upsert).toHaveBeenCalled();
    });

    it('rejects an invalid module', async () => {
      mocks.validateModule.mockReturnValue(['Title is required']);

      await expect(saveModuleToCloud(testDocument)).rejects.toThrow('Cannot save invalid module');

      expect(mocks.supabase.from).not.toHaveBeenCalled();
    });

    it('rejects when Supabase authentication returns an error', async () => {
      mocks.supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Authentication failed' },
      });

      await expect(saveModuleToCloud(testDocument)).rejects.toThrow('Authentication failed');
    });

    it('rejects when no user is signed in', async () => {
      mocks.supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(saveModuleToCloud(testDocument)).rejects.toThrow(
        'Please sign in before saving modules.',
      );
    });

    it('reports cloud save errors', async () => {
      mocks.chain.upsert.mockResolvedValue({
        error: { message: 'Database unavailable' },
      });

      await expect(saveModuleToCloud(testDocument)).rejects.toThrow(
        'Cloud save failed: Database unavailable',
      );
    });
  });

  describe('getMyCloudModules', () => {
    it('returns the authenticated user modules', async () => {
      const rows = [
        {
          id: 'record-1',
          module_id: 'module-1',
          title: 'Finance Basics',
          description: 'Introduction',
          document: testDocument,
          created_at: '2026-11-09T10:00:00.000Z',
          updated_at: '2026-11-09T11:00:00.000Z',
        },
      ];

      mocks.state.result = { data: rows, error: null };

      const result = await getMyCloudModules();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'record-1',
        moduleId: 'module-1',
        title: 'Finance Basics',
        description: 'Introduction',
        document: testDocument,
        createdAt: '2026-11-09T10:00:00.000Z',
        updatedAt: '2026-11-09T11:00:00.000Z',
      });

      expect(mocks.chain.select).toHaveBeenCalled();
      expect(mocks.chain.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    });

    it('returns an empty array when no modules exist', async () => {
      mocks.state.result = { data: null, error: null };

      await expect(getMyCloudModules()).resolves.toEqual([]);
    });

    it('reports module loading errors', async () => {
      mocks.state.result = {
        data: null,
        error: { message: 'Database unavailable' },
      };

      await expect(getMyCloudModules()).rejects.toThrow(
        'Could not load modules: Database unavailable',
      );
    });
  });

  describe('deleteCloudModule', () => {
  it('deletes a module successfully', async () => {
    mocks.chain.delete.mockReturnValue(mocks.chain);

    mocks.chain.eq
      .mockReturnValueOnce(mocks.chain)
      .mockResolvedValueOnce({ error: null });

    await expect(
      deleteCloudModule('module-123')
    ).resolves.toBeUndefined();

    expect(mocks.supabase.from).toHaveBeenCalledWith(
      'financial_modules'
    );

    expect(mocks.chain.delete).toHaveBeenCalled();
  });

  it('reports deletion errors', async () => {
    mocks.chain.delete.mockReturnValue(mocks.chain);

    mocks.chain.eq
      .mockReturnValueOnce(mocks.chain)
      .mockResolvedValueOnce({
        error: { message: 'Delete failed' },
      });

    await expect(
      deleteCloudModule('module-123')
    ).rejects.toThrow(
      'Could not delete module: Delete failed'
    );
  });
});
});
