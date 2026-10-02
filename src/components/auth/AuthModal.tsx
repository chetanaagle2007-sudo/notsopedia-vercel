import React, { useState, useEffect } from "react";
import {
  UserCheck,
  X,
  Mail,
  Lock,
  User,
  GraduationCap,
  Building,
} from "lucide-react";
import { SignedInUser } from "../../types";
import { supabase } from "../../supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (user: SignedInUser) => void;
  initialIsAdmin?: boolean;
}

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  institution: string | null;
  is_admin: boolean | null;
}

export function AuthModal({
  isOpen,
  onClose,
  onSignIn,
  initialIsAdmin = false,
}: AuthModalProps) {
  const [authMode, setAuthMode] = useState<"student" | "account">("student");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Student");
  const [institution, setInstitution] = useState(
    "State Technological University"
  );

  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (initialIsAdmin) {
      setAuthMode("account");
    }
  }, [initialIsAdmin, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage("");
      setSuccessMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    setErrorMessage(
      "Student Profile mode does not create an authenticated session. Please use the Supabase Auth tab to sign in or create an account."
    );
  };

  const loadProfileAndSignIn = async (
    authUser: {
      id: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    }
  ) => {
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, email, role, institution, is_admin")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(
        `Unable to load your Notsopedia profile: ${profileError.message}`
      );
    }

    if (!profile) {
      await supabase.auth.signOut();
      throw new Error(
        "Your account is authenticated, but no matching Notsopedia profile exists. Please contact the administrator."
      );
    }

    const typedProfile = profile as ProfileRow;

    const metadataName =
      typeof authUser.user_metadata?.name === "string"
        ? authUser.user_metadata.name
        : "";

    const signedInUser: SignedInUser = {
      id: authUser.id,
      name:
        typedProfile.name?.trim() ||
        metadataName ||
        authUser.email?.split("@")[0] ||
        "Authenticated User",
      email: typedProfile.email?.trim() || authUser.email || "",
      role: typedProfile.role?.trim() || "Student",
      institution:
        typedProfile.institution?.trim() || "Verified Institution",
      isAdmin: Boolean(typedProfile.is_admin),
    };

    onSignIn(signedInUser);
    onClose();
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const normalizedEmail = accountEmail.trim().toLowerCase();

    if (!normalizedEmail || !accountPassword) {
      setErrorMessage("Please enter your email address and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: accountPassword,
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error(
            "Account creation did not return an authenticated user."
          );
        }

        if (!data.session) {
          setSuccessMessage(
            "Account created successfully. Check your email if confirmation is required, then sign in."
          );
          setIsSignUp(false);
          setAccountPassword("");
          return;
        }

        await loadProfileAndSignIn(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: accountPassword,
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error(
            "Authentication succeeded but no authenticated user was returned."
          );
        }

        await loadProfileAndSignIn(data.user);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 md:p-8 space-y-5 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif italic font-bold text-lg text-slate-900 dark:text-white">
                Notsopedia Identity Gate
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Authenticate your student profile or access credentials
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setAuthMode("student");
            }}
            className={`py-2 rounded-lg transition ${
              authMode === "student"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Student Profile
          </button>

          <button
            type="button"
            onClick={() => {
              clearMessages();
              setAuthMode("account");
            }}
            className={`py-2 rounded-lg transition ${
              authMode === "account"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Supabase Auth
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-[11px] text-red-800 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-[11px] text-emerald-800 dark:text-emerald-300">
            {successMessage}
          </div>
        )}

        {authMode === "student" && (
          <form onSubmit={handleStudentSubmit} className="space-y-3.5 text-xs">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Student Profile mode is informational only. Use Supabase Auth to
              create or access a real authenticated Notsopedia account.
            </p>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Chetan Aagle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Academic Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <input
                  type="email"
                  placeholder="e.g. chetan@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Academic Role
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="h-3.5 w-3.5" />
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Student">Student Participant</option>
                  <option value="Representative">
                    Class Representative (CR)
                  </option>
                  <option value="Professor">
                    Faculty Member / Professor
                  </option>
                  <option value="Lead TA">Teaching Assistant</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                University / Institution
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. State Technological University"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setAuthMode("account");
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
              >
                Use Supabase Auth
              </button>
            </div>
          </form>
        )}

        {authMode === "account" && (
          <form onSubmit={handleAccountSubmit} className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 text-[11px] text-indigo-900 dark:text-indigo-300">
              <strong>Supabase Auth:</strong> Sign in with your registered
              account or create a new account.
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Email Address *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <input
                  type="email"
                  placeholder="your email address"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Password *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                </span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setIsSignUp(!isSignUp);
                }}
                disabled={isSubmitting}
                className="hover:underline text-indigo-600 dark:text-indigo-400 disabled:opacity-50"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Need an account? Sign up"}
              </button>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Authenticating..."
                  : isSignUp
                    ? "Create Account"
                    : "Authenticate Session"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
