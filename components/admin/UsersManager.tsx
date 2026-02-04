'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SiteConfig, User } from '@/lib/types';
import { Button } from '@/components/ui';

interface UsersManagerProps {
  sites: SiteConfig[];
}

type UserDraft = Pick<User, 'name' | 'email' | 'role' | 'sites'> & {
  password?: string;
  newPassword?: string;
};

export function UsersManager({ sites }: UsersManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [newUser, setNewUser] = useState<UserDraft>({
    name: '',
    email: '',
    role: 'editor',
    sites: [],
    password: '',
  });

  const loadUsers = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Failed to load users');
      }
      const payload = await response.json();
      setUsers(payload.users || []);
    } catch (error: any) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async () => {
    const response = await fetch('/api/admin/auth/session');
    if (!response.ok) return;
    const payload = await response.json();
    setCurrentUserId(payload?.user?.id || null);
  };

  useEffect(() => {
    loadUsers();
    loadSession();
  }, []);

  useEffect(() => {
    const nextDrafts: Record<string, UserDraft> = {};
    users.forEach((user) => {
      nextDrafts[user.id] = {
        name: user.name,
        email: user.email,
        role: user.role,
        sites: user.sites || [],
      };
    });
    setDrafts(nextDrafts);
  }, [users]);

  const siteOptions = useMemo(() => sites.map((site) => site.id), [sites]);

  const updateDraft = (id: string, updates: Partial<UserDraft>) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...updates },
    }));
  };

  const handleCreate = async () => {
    setStatus(null);
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        sites: newUser.sites,
        password: newUser.password,
      }),
    });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Create failed');
      return;
    }
    setNewUser({ name: '', email: '', role: 'editor', sites: [], password: '' });
    await loadUsers();
  };

  const handleSave = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: draft.name,
        email: draft.email,
        role: draft.role,
        sites: draft.sites,
      }),
    });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Save failed');
      return;
    }
    await loadUsers();
    setStatus('Saved');
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this user? This cannot be undone.');
    if (!confirmed) return;
    const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Delete failed');
      return;
    }
    await loadUsers();
  };

  const handleSetPassword = async (id: string) => {
    const draft = drafts[id];
    if (!draft?.newPassword) {
      setStatus('Enter a new password first.');
      return;
    }
    const response = await fetch(`/api/admin/users/${id}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: draft.newPassword }),
    });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Password update failed');
      return;
    }
    updateDraft(id, { newPassword: '' });
    setStatus('Password updated');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-600">Invite team members and manage roles.</p>
      </div>

      {status && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {status}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="text-sm font-semibold text-gray-900">Add user</div>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Name"
            value={newUser.name}
            onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
          />
          <input
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Email"
            value={newUser.email}
            onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
          />
          <input
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Temporary password"
            type="password"
            value={newUser.password}
            onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
          />
          <select
            className="rounded-md border border-gray-200 px-3 py-2 text-sm"
            value={newUser.role}
            onChange={(event) =>
              setNewUser({ ...newUser, role: event.target.value as User['role'] })
            }
          >
            <option value="super_admin">Super Admin</option>
            <option value="site_admin">Site Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {siteOptions.map((siteId) => (
            <label key={siteId} className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={newUser.sites.includes(siteId)}
                onChange={(event) => {
                  const nextSites = event.target.checked
                    ? [...newUser.sites, siteId]
                    : newUser.sites.filter((id) => id !== siteId);
                  setNewUser({ ...newUser, sites: nextSites });
                }}
              />
              {siteId}
            </label>
          ))}
        </div>
        <Button onClick={handleCreate}>Create user</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="text-sm font-semibold text-gray-900">Existing users</div>
        {loading ? (
          <div className="text-sm text-gray-500">Loading users…</div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => {
              const draft = drafts[user.id];
              return (
                <div key={user.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="grid gap-3 md:grid-cols-4">
                    <input
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={draft?.name || ''}
                      onChange={(event) =>
                        updateDraft(user.id, { name: event.target.value })
                      }
                    />
                    <input
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={draft?.email || ''}
                      onChange={(event) =>
                        updateDraft(user.id, { email: event.target.value })
                      }
                    />
                    <select
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                      value={draft?.role || 'editor'}
                      onChange={(event) =>
                        updateDraft(user.id, {
                          role: event.target.value as User['role'],
                        })
                      }
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="site_admin">Site Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <input
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="New password"
                      type="password"
                      value={draft?.newPassword || ''}
                      onChange={(event) =>
                        updateDraft(user.id, { newPassword: event.target.value })
                      }
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {siteOptions.map((siteId) => (
                      <label
                        key={`${user.id}-${siteId}`}
                        className="flex items-center gap-2 text-xs text-gray-600"
                      >
                        <input
                          type="checkbox"
                          checked={draft?.sites?.includes(siteId) || false}
                          onChange={(event) => {
                            const nextSites = event.target.checked
                              ? [...(draft?.sites || []), siteId]
                              : (draft?.sites || []).filter((id) => id !== siteId);
                            updateDraft(user.id, { sites: nextSites });
                          }}
                        />
                        {siteId}
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => handleSave(user.id)}>
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => handleSetPassword(user.id)}>
                      Set Password
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(user.id)}
                      disabled={user.id === currentUserId}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
            {users.length === 0 && (
              <div className="text-sm text-gray-500">No users yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
