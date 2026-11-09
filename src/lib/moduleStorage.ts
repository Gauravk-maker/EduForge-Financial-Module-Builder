
import { supabase, isSupabaseConfigured } from './supabase';
import { validateModule } from './document';
import type { ModuleDocument } from '../types';

export interface SavedModule {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  document: ModuleDocument;
  createdAt: string;
  updatedAt: string;
}

function getSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Check your .env.local file.');
  }

  return supabase;
}

async function getCurrentUserId(): Promise<string> {
  const client = getSupabase();

  const { data, error } = await client.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Please sign in before saving modules.');
  }

  return data.user.id;
}

/**
 * Save a module to the authenticated user's cloud storage.
 * If the same module already exists, update its existing record.
 */
export async function saveModuleToCloud(
  document: ModuleDocument
): Promise<void> {
  const errors = validateModule(document);

  if (errors.length > 0) {
    throw new Error(
      `Cannot save invalid module: ${errors.join(', ')}`
    );
  }

  const client = getSupabase();
  const userId = await getCurrentUserId();

  const { error } = await client
    .from('financial_modules')
    .upsert(
      {
        user_id: userId,
        module_id: document.moduleId,
        title: document.title,
        description: document.description,
        document,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,module_id',
      }
    );

  if (error) {
    throw new Error(`Cloud save failed: ${error.message}`);
  }
}

/**
 * Fetch all modules belonging to the currently signed-in user.
 */
export async function getMyCloudModules(): Promise<SavedModule[]> {
  const client = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await client
    .from('financial_modules')
    .select('id, module_id, title, description, document, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Could not load modules: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    moduleId: row.module_id,
    title: row.title,
    description: row.description,
    document: row.document as ModuleDocument,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Delete a module belonging to the currently signed-in user.
 */
export async function deleteCloudModule(
  moduleId: string
): Promise<void> {
  const client = getSupabase();
  const userId = await getCurrentUserId();

  const { error } = await client
    .from('financial_modules')
    .delete()
    .eq('user_id', userId)
    .eq('module_id', moduleId);

  if (error) {
    throw new Error(`Could not delete module: ${error.message}`);
  }
}
