import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  GraduationCap,
  Building,
  ArrowLeft,
  Loader2,
  KeyRound
} from "lucide-react";
import { SignedInUser } from "../../types";
import { supabase } from "../../supabase";
import { UI_LABELS } from "../../constants/labels";

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
  initialIsAdmin = false
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"signIn" | "createAccount">("signIn");
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [academicRole, setAcademicRole] = useState("Student");
  const [institution, setInstitution] = useState("State Technological University");

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage("");
      setSuccessMessage("");
      setIsSubmitting(false);
      setEmail("");
      setPassword("");
      setIsForgotPassword(false);
    }
  }, [isOpen]);

  // Handle Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
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
        `Unable to load your profile: ${profileError.message}`
      );
    }

    if (!profile) {
      await supabase.auth.signOut();
      throw new Error(
        "Your account is authenticated, but no matching profile exists. Please contact the administrator."
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
        "Scholar",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!isForgotPassword && !password) {
      setErrorMessage("Please enter your password.");
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
          "Password reset link sent! Check your inbox to create a new password."
        );
        setPassword("");
        return;
      }

      if (activeTab === "createAccount") {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              name: fullName.trim() || undefined,
              role: academicRole,
              institution: institution.trim() || undefined
            }
          },
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error("Account registration did not return a valid user.");
        }

        if (!data.session) {
          setSuccessMessage(
            "Account created! Check your email to confirm your address, then sign in."
          );
          setActiveTab("signIn");
          setPassword("");
          return;
        }

        await loadProfileAndSignIn(data.user);
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: password,
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error("Authentication succeeded but no user session was returned.");
        }

        await loadProfileAndSignIn(data.user);
      }
    } catch (error) {
      const errStr = error instanceof Error ? error.message : String(error);
      if (errStr.toLowerCase().includes("email not confirmed")) {
        setErrorMessage("Your email address has not been confirmed yet. Please check your inbox or click 'Resend confirmation' below.");
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : isForgotPassword
              ? "Unable to send the password reset email. Please try again."
              : "Authentication failed. Please check your credentials and try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    clearMessages();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setErrorMessage("Please enter your email address to receive the confirmation email.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      setSuccessMessage("Verification email dispatched! Please check your inbox.");
    } catch (err: any) {
      setErrorMessage(err?.message || "Could not resend confirmation email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isForgotPassword ? UI_LABELS.auth.forgotPasswordTitle : activeTab === "createAccount" ? UI_LABELS.auth.createAccountTitle : UI_LABELS.auth.signInTitle}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-8 space-y-5 transition-colors my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif italic font-bold text-lg text-slate-900 dark:text-white">
                {isForgotPassword
                  ? UI_LABELS.auth.forgotPasswordTitle
                  : activeTab === "createAccount"
                  ? UI_LABELS.auth.createAccountTitle
                  : UI_LABELS.auth.signInTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isForgotPassword
                  ? UI_LABELS.auth.forgotPasswordSubtitle
                  : activeTab === "createAccount"
                  ? UI_LABELS.auth.createAccountSubtitle
                  : UI_LABELS.auth.signInSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={UI_LABELS.actions.close}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Create Account (Hidden when in Forgot Password mode) */}
        {!isForgotPassword && (
          <div
            className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold"
            role="tablist"
            aria-label="Account access modes"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "signIn"}
              onClick={() => {
                clearMessages();
                setActiveTab("signIn");
              }}
              className={`h-8 rounded-lg transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === "signIn"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {UI_LABELS.actions.signIn}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "createAccount"}
              onClick={() => {
                clearMessages();
                setActiveTab("createAccount");
              }}
              className={`h-8 rounded-lg transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === "createAccount"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {UI_LABELS.actions.createAccount}
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 space-y-1.5">
            <p>{errorMessage}</p>
            {errorMessage.toLowerCase().includes("confirm") && email && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={isSubmitting}
                className="font-bold underline text-rose-900 dark:text-rose-200 hover:text-rose-700 transition"
              >
                Resend confirmation email now
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} autoComplete="on" className="space-y-3.5 text-xs">
          {!isForgotPassword && (
            <>
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full h-10 flex items-center justify-center gap-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-2xs disabled:opacity-60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M21.35 12.27c0-.71-.06-1.4-.18-2.06H12v3.9h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.23Z" />
                  <path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z" />
                  <path fill="#FBBC05" d="M6.54 13.59A5.86 5.86 0 0 1 6.23 12c0-.55.1-1.09.31-1.59V7.88H3.3A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.12l3.24-2.53Z" />
                  <path fill="#EA4335" d="M12 6.38c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.48 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 8.1 9.46 6.38 12 6.38Z" />
                </svg>
                <span>{UI_LABELS.auth.continueWithGoogle}</span>
              </button>

              <div className="flex items-center gap-3 py-0.5">
                <div className="h-px flex-1 bg-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800" />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                  or with email
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800" />
              </div>
            </>
          )}

          {/* Full Name (Sign Up only) */}
          {activeTab === "createAccount" && !isForgotPassword && (
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
                  placeholder="e.g. Chetana Agle"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
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
                placeholder="e.g. student@university.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Password (Hidden in Forgot Password mode) */}
          {!isForgotPassword && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Password *
                </label>
                {activeTab === "signIn" && (
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setIsForgotPassword(true);
                    }}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {UI_LABELS.auth.forgotPasswordLink}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          )}

          {/* Role & Institution (Sign Up only) */}
          {activeTab === "createAccount" && !isForgotPassword && (
            <>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Academic Role
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="h-3.5 w-3.5" />
                  </span>
                  <select
                    value={academicRole}
                    onChange={(e) => setAcademicRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="Student">Student Participant</option>
                    <option value="Representative">Class Representative (CR)</option>
                    <option value="Professor">Faculty Member / Professor</option>
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
            </>
          )}

          {/* Form Actions */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center space-x-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isForgotPassword ? (
                <span>Send Reset Link</span>
              ) : activeTab === "createAccount" ? (
                <span>{UI_LABELS.actions.createAccount}</span>
              ) : (
                <span>{UI_LABELS.actions.signIn}</span>
              )}
            </button>
          </div>

          {/* Return link when in Forgot Password mode */}
          {isForgotPassword && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setIsForgotPassword(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
