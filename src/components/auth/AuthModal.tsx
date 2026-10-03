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
  const [isForgotPassword, setIsForgotPassword] = useState(false);

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
      setAccountEmail("");
      setAccountPassword("");
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

  const handleGoogleSignIn = async () => {
    clearMessages();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setIsSubmitting(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to continue with Google. Please try again."
      );
    }
  };
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const normalizedEmail = accountEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!isForgotPassword && !accountPassword) {
      setErrorMessage("Please enter your email address and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          }
        );

        if (error) throw error;

        setSuccessMessage(
          "Password reset email sent. Check your inbox and follow the link to create a new password."
        );
        setAccountPassword("");
        return;
      }

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: accountPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error(
            "Account creation did not return an authenticated user."
          );
        }

        if (!data.session) {
          setSuccessMessage(
            "Account created successfully. Check your email to confirm your account, then sign in."
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
          : isForgotPassword
            ? "Unable to send the password reset email. Please try again."
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
          <form onSubmit={handleAccountSubmit} autoComplete="off" className="space-y-3.5 text-xs">
            {!isForgotPassword && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="#4285F4" d="M21.35 12.27c0-.71-.06-1.4-.18-2.06H12v3.9h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.23Z" />
  <path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z" />
  <path fill="#FBBC05" d="M6.54 13.59A5.86 5.86 0 0 1 6.23 12c0-.55.1-1.09.31-1.59V7.88H3.3A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.12l3.24-2.53Z" />
  <path fill="#EA4335" d="M12 6.38c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.48 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 8.1 9.46 6.38 12 6.38Z" />
</svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    or
                  </span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>
              </>
            )}

            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 text-[11px] text-indigo-900 dark:text-indigo-300">
              <strong>Supabase Auth:</strong>{" "}
              {isForgotPassword
                ? "Enter your email address and we will send you a password reset link."
                : isSignUp
                  ? "Create a new Notsopedia account."
                  : "Sign in with your registered account."}
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

            {!isForgotPassword && (
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
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setIsForgotPassword(false);
                    setIsSignUp(false);
                  }}
                  disabled={isSubmitting}
                  className="hover:underline text-indigo-600 dark:text-indigo-400 disabled:opacity-50"
                >
                  ? Back to Sign In
                </button>
              ) : (
                <>
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

                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setIsForgotPassword(true);
                        setIsSignUp(false);
                      }}
                      disabled={isSubmitting}
                      className="hover:underline text-indigo-600 dark:text-indigo-400 disabled:opacity-50"
                    >
                      Forgot password?
                    </button>
                  )}
                </>
              )}
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
                  ? isForgotPassword
                    ? "Sending reset link..."
                    : "Authenticating..."
                  : isForgotPassword
                    ? "Send Reset Link"
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








