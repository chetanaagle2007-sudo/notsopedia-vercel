import React, { useEffect, useState } from "react";
import { CheckCircle2, LockKeyhole, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "../../supabase";

type AuthFlowPageProps = {
  mode: "callback" | "reset-password";
};

export function AuthFlowPage({ mode }: AuthFlowPageProps) {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const restoreAuthFlow = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        }

        const {
          data: { session },
          error
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!cancelled) {
          setHasSession(Boolean(session?.user));
        }
      } catch (error) {
        console.error("Auth flow error:", error);

        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "We could not complete this authentication step."
          );
        }
      } finally {
        if (!cancelled) {
          setIsCheckingSession(false);
        }
      }
    };

    void restoreAuthFlow();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) {
        return;
      }

      if (event === "PASSWORD_RECOVERY") {
        setHasSession(Boolean(session?.user));
        setIsCheckingSession(false);
        setErrorMessage("");
      }

      if (event === "SIGNED_IN" && mode === "reset-password") {
        setHasSession(Boolean(session?.user));
        setIsCheckingSession(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [mode]);

  const goToSignIn = () => {
    window.history.replaceState({}, "", "/");
    window.location.reload();
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        throw error;
      }

      setPassword("");
      setConfirmPassword("");
      setPasswordUpdated(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update your password. Please request a new reset email."
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isCheckingSession) {
    return (
      <AuthFlowShell>
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Verifying your Notsopedia session...
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Please wait a moment.
        </p>
      </AuthFlowShell>
    );
  }

  if (mode === "callback") {
    return (
      <AuthFlowShell>
        <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-950">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Authentication successful
        </h1>

        {hasSession ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your Notsopedia account is verified. You can continue to the
            application and sign in.
          </p>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your email confirmation was processed. Continue to Notsopedia and
            sign in with your account.
          </p>
        )}

        {errorMessage && (
          <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={goToSignIn}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          Continue to Notsopedia
        </button>
      </AuthFlowShell>
    );
  }

  if (passwordUpdated) {
    return (
      <AuthFlowShell>
        <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-950">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Password updated
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your Notsopedia password has been changed successfully.
        </p>

        <button
          type="button"
          onClick={goToSignIn}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          Continue to Sign In
        </button>
      </AuthFlowShell>
    );
  }

  return (
    <AuthFlowShell>
      <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-950">
        <LockKeyhole className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Create a new password
      </h1>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Choose a new password for your Notsopedia account.
      </p>

      {!hasSession && (
        <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
          This password-reset session is no longer valid. Please request a new
          password-reset email.
        </div>
      )}

      {errorMessage && (
        <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handlePasswordUpdate} className="w-full space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          autoComplete="new-password"
          disabled={!hasSession || isUpdatingPassword}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          disabled={!hasSession || isUpdatingPassword}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />

        <button
          type="submit"
          disabled={!hasSession || isUpdatingPassword}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUpdatingPassword ? "Updating password..." : "Update Password"}
        </button>
      </form>

      <button
        type="button"
        onClick={goToSignIn}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Notsopedia
      </button>
    </AuthFlowShell>
  );
}

function AuthFlowShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full space-y-5 rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="space-y-5 flex flex-col items-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}


