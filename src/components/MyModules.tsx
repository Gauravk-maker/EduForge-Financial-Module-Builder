
import { useEffect, useState } from 'react';
import {
  Cloud,
  RefreshCw,
  Trash2,
  FolderOpen,
  Clock,
  AlertCircle,
} from 'lucide-react';

import {
  getMyCloudModules,
  deleteCloudModule,
  type SavedModule,
} from '../lib/moduleStorage';

import type { ModuleDocument } from '../types';

interface MyModulesProps {
  onLoad: (document: ModuleDocument) => void;
}

export function MyModules({ onLoad }: MyModulesProps) {
  const [modules, setModules] = useState<SavedModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refreshModules() {
    setLoading(true);
    setError('');

    try {
      const result = await getMyCloudModules();
      setModules(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load your modules.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshModules();
  }, []);

  async function handleDelete(module: SavedModule) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${module.title}" from cloud storage?`
    );

    if (!confirmed) return;

    setDeletingId(module.moduleId);
    setError('');

    try {
      await deleteCloudModule(module.moduleId);

      setModules((current) =>
        current.filter((item) => item.moduleId !== module.moduleId)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete this module.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }

    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  return (
    <div className="my-modules">
      <div className="my-modules-toolbar">
        <div>
          <p className="muted">
            Your modules are securely stored in your account.
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={() => void refreshModules()}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="my-modules-error" role="alert">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="my-modules-empty" role="status">
          <RefreshCw size={24} />
          <p>Loading your cloud modules...</p>
        </div>
      ) : modules.length === 0 ? (
        <div className="my-modules-empty">
          <Cloud size={32} />
          <h3>No saved modules yet</h3>
          <p>
            Save your current financial education module to find it here.
          </p>
        </div>
      ) : (
        <div className="my-modules-list">
          {modules.map((module) => (
            <article className="my-module-card" key={module.id}>
              <div className="my-module-info">
                <div className="my-module-icon">
                  <FolderOpen size={20} />
                </div>

                <div className="my-module-details">
                  <h3>{module.title}</h3>

                  <p>
                    {module.description || 'No description provided'}
                  </p>

                  <small>
                    <Clock size={13} />
                    Updated {formatDate(module.updatedAt)}
                  </small>
                </div>
              </div>

              <div className="my-module-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => onLoad(module.document)}
                >
                  <FolderOpen size={15} />
                  Open
                </button>

                <button
                  className="btn btn-quiet"
                  onClick={() => void handleDelete(module)}
                  disabled={deletingId === module.moduleId}
                  title="Delete cloud module"
                  aria-label={`Delete ${module.title}`}
                >
                  <Trash2 size={16} />
                  {deletingId === module.moduleId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
