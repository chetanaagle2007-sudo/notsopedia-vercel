import React, { useMemo, useState } from "react";
import { Shield, Lock, FileText, CheckCircle2, Megaphone, Search, Edit3, Trash2, Users, UserCircle, X } from "lucide-react";
import { SignedInUser, SystemConfig, UserNote } from "../../types";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  institution: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
}
import { SystemSettingsCard } from "./SystemSettingsCard";
import { SecurityTerminalCard } from "./SecurityTerminalCard";

interface AdminPortalProps {
  signedInUser: SignedInUser | null;
  onOpenAuthModal: () => void;
  systemConfig: SystemConfig;
  onSaveConfig: (updated: Partial<SystemConfig>) => void;
  isSavingConfig: boolean;
  onResetDatabase: () => void;
  securityLogs: string[];
  isHealing: boolean;
  onRunHealing: () => void;
  totalNotesCount: number;
  notes: UserNote[];
  onEditNote: (note: UserNote) => void;
  onDeleteNote: (id: string) => void;
}

export function AdminPortal({
  signedInUser,
  onOpenAuthModal,
  systemConfig,
  onSaveConfig,
  isSavingConfig,
  onResetDatabase,
  securityLogs,
  isHealing,
  onRunHealing,
  totalNotesCount,
  notes,
  onEditNote,
  onDeleteNote
}: AdminPortalProps) {
  const isAdmin = Boolean(signedInUser && signedInUser.isAdmin);
  const [noteSearch, setNoteSearch] = useState('');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userLoadError, setUserLoadError] = useState('');
  React.useEffect(() => {
    if (!isAdmin) {
      setAdminUsers([]);
      return;
    }

    let cancelled = false;

    const loadAdminUsers = async () => {
      setIsLoadingUsers(true);
      setUserLoadError('');

      try {
        const { data: { session }, error: sessionError } = await import("../../supabase").then(
          ({ supabase }) => supabase.auth.getSession()
        );

        if (sessionError || !session?.access_token) {
          throw new Error("Your administrator session has expired. Please sign in again.");
        }

        const response = await fetch("/api/admin/users", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load users.");
        }

        if (!cancelled) {
          setAdminUsers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load admin users:", error);

        if (!cancelled) {
          setUserLoadError(
            error instanceof Error ? error.message : "Unable to load users."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingUsers(false);
        }
      }
    };

    loadAdminUsers();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    if (!query) {
      return adminUsers;
    }

    return adminUsers.filter((user) =>
      [
        user.name,
        user.email,
        user.role,
        user.institution,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [adminUsers, userSearch]);

  const activeUsersCount = useMemo(() => {
    return adminUsers.filter((user) => {
      if (!user.last_sign_in_at) return false;

      const lastSignIn = new Date(user.last_sign_in_at).getTime();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      return lastSignIn >= sevenDaysAgo;
    }).length;
  }, [adminUsers]);
  const filteredNotes = useMemo(() => {
    const query = noteSearch.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter((note) => [note.title, note.subject, note.topic, note.uploaderName].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
  }, [notes, noteSearch]);

  return (
    <div className="space-y-6">
      {/* Console Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-700 dark:text-amber-400 shrink-0">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif italic text-slate-900 dark:text-white">
              System Control Console
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
              Authorized administrators can configure platform broadcasts, toggle peer uploads,
              moderate community study notes, and run the autonomous security healing daemon.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {isAdmin ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold uppercase flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Admin Credentials Active</span>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase rounded-xl transition shadow-xs flex items-center space-x-2"
            >
              <Lock className="h-4 w-4" />
              <span>Unlock Admin Console</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[11px] font-mono uppercase">Vault Notes</span>
            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
            {totalNotesCount}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[11px] font-mono uppercase">Submissions</span>
            {systemConfig.enableSubmissions ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Lock className="h-4 w-4 text-rose-600" />
            )}
          </div>
          <div className="text-sm font-bold font-sans text-slate-900 dark:text-white mt-1">
            {systemConfig.enableSubmissions ? "Open for Students" : "Locked Down"}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[11px] font-mono uppercase">Broadcast</span>
            <Megaphone className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold font-sans text-slate-900 dark:text-white mt-1">
            {systemConfig.announcementActive ? "Active Marquee" : "Muted"}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[11px] font-mono uppercase">Daemon Shield</span>
            <Shield className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-sm font-bold font-sans text-emerald-600 dark:text-emerald-400 mt-1">
            Armed & Healthy
          </div>
        </div>
      </div>

      {/* User Management */}
      {isAdmin && (
        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200/70 dark:border-slate-700/70">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    User Management
                  </h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  View platform users and account activity. Only administrators can access this information.
                </p>
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 border-b border-slate-200/70 dark:border-slate-700/70">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wide text-slate-500">
                  Total Users
                </span>
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {isLoadingUsers ? "..." : adminUsers.length}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wide text-slate-500">
                  Active Users
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {isLoadingUsers ? "..." : activeUsersCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Signed in within the last 7 days
              </p>
            </div>
          </div>

          <div className="p-5">
            {userLoadError ? (
              <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-4 text-sm text-rose-700 dark:text-rose-300">
                {userLoadError}
              </div>
            ) : isLoadingUsers ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                {userSearch ? "No users match your search." : "No users found."}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                        <UserCircle className="h-5 w-5 text-indigo-500" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white break-all">{user.name || "Unnamed user"}</p><p className="text-xs text-slate-500 dark:text-slate-400 break-all mt-0.5">{user.email}</p>

                          {user.is_admin && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                              ADMIN
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>{user.role || "No role"}</span>
                          <span>{user.institution || "No institution"}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition shrink-0"
                    >
                      <UserCircle className="h-4 w-4" />
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* User Details Modal */}
      {isAdmin && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  User Details
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Administrator-only account information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                aria-label="Close user details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-[11px] font-mono uppercase text-slate-400">
                  Email
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white break-all mt-1">
                  {selectedUser.email}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-mono uppercase text-slate-400">
                    Role
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {selectedUser.role || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-mono uppercase text-slate-400">
                    Institution
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {selectedUser.institution || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-mono uppercase text-slate-400">
                    Account Created
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {new Date(selectedUser.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-mono uppercase text-slate-400">
                    Last Sign-in
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {selectedUser.last_sign_in_at
                      ? new Date(selectedUser.last_sign_in_at).toLocaleString()
                      : "No sign-in recorded"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Administrator</span>
                  <span className={`text-xs font-semibold ${selectedUser.is_admin ? "text-amber-600" : "text-slate-500"}`}>
                    {selectedUser.is_admin ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Note Moderation */}
      <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/70 dark:border-slate-700/70">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Note Moderation</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Review, edit, and remove community study notes.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                placeholder="Search notes..."
                disabled={!isAdmin}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400/40 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {!isAdmin ? (
          <div className="p-8 text-center">
            <Lock className="h-8 w-8 mx-auto text-slate-400 mb-3" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">Administrator access required</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sign in with an authorized administrator account to moderate notes.
            </p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-8 w-8 mx-auto text-slate-400 mb-3" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">No notes found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {noteSearch ? "Try a different search term." : "There are currently no study notes to moderate."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/70 dark:divide-slate-700/70">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {note.title || "Untitled Note"}
                    </h3>
                    {note.subject && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {note.subject}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                    {note.topic && <span>Topic: {note.topic}</span>}
                    {note.uploaderName && <span>By: {note.uploaderName}</span>}
                  </div>

                  {note.content && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {note.content}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditNote(note)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Moderate / Edit Note"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteNote(note.id)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {/* Main Admin Panels: Settings & Terminal */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 relative ${!isAdmin ? "opacity-50 select-none" : ""}`}>
        {!isAdmin && (
          <div className="absolute inset-0 z-10 bg-slate-100/60 dark:bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center rounded-3xl space-y-3">
            <div className="p-3 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Administrative Passcode Required</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed font-sans">
              Sign in with administrative privileges to configure system parameters and moderate study documents.
            </p>
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
            >
              Sign In As Administrator
            </button>
          </div>
        )}

        <SystemSettingsCard
          systemConfig={systemConfig}
          onSaveConfig={onSaveConfig}
          isSaving={isSavingConfig}
          onResetDatabase={onResetDatabase}
        />

        <SecurityTerminalCard
          logs={securityLogs}
          isHealing={isHealing}
          onRunHealing={onRunHealing}
        />
      </div>
    </div>
  );
}



