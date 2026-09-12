import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PixelButton } from '../rpg/PixelButton';
import { chiptune } from '../../services/audio';

export const AuthHomePage: React.FC = () => {
  const {
    firebaseUser,
    isVerified,
    authError,
    clearAuthError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    resendVerificationEmail,
    reloadUserStatus,
    signOutUser,
  } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'RESET'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    clearAuthError();
    setFeedback(null);
    setLoading(true);
    try {
      chiptune.playSelect();
      await signInWithGoogle();
      chiptune.playLevelUp();
    } catch {
      chiptune.playHit();
    } finally {
      setLoading(false);
    }
  };

  const isUnverified = firebaseUser && !isVerified;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setFeedback(null);

    if (!email.trim() || !password.trim()) {
      setFeedback('Please enter both email and password.');
      chiptune.playHit();
      return;
    }

    if ((mode === 'REGISTER' || mode === 'RESET') && password !== confirmPassword) {
      setFeedback('Passwords do not match.');
      chiptune.playHit();
      return;
    }

    setLoading(true);
    try {
      if (mode === 'REGISTER') {
        await signUpWithEmail(email, password, '');
        chiptune.playLevelUp();
        setFeedback('Account ready! Welcome, Trainer.');
      } else if (mode === 'RESET') {
        await resetPassword(email, password);
        chiptune.playLevelUp();
        setFeedback('Password updated successfully! Welcome back.');
      } else {
        await signInWithEmail(email, password);
        chiptune.playSelect();
        setFeedback('Signed in successfully!');
      }
    } catch (err: any) {
      chiptune.playHit();
      setFeedback(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const verified = await reloadUserStatus();
      if (verified) {
        chiptune.playLevelUp();
        setFeedback('✓ Email verified!');
      } else {
        chiptune.playHit();
        setFeedback('Email is not verified yet. Please click the link sent to your email first.');
      }
    } catch {
      chiptune.playHit();
      setFeedback('Error checking verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      await resendVerificationEmail();
      chiptune.playSelect();
      setFeedback('Verification link resent. Check your inbox.');
    } catch (err: any) {
      chiptune.playHit();
      setFeedback(err.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0c1a] flex flex-col justify-center items-center p-3 sm:p-6 select-none font-silkscreen relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b162b_1px,transparent_1px),linear-gradient(to_bottom,#1b162b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md border-4 border-[#120e1d] bg-[#f5eedb] p-5 sm:p-7 shadow-[8px_8px_0px_#000]">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-[#e43b44] border-2 border-[#120e1d] flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <span className="font-pixel text-sm text-white font-bold">L</span>
            </div>
            <h1 className="font-pixel text-xl sm:text-2xl text-[#181425] tracking-wider">
              LIFE RPG
            </h1>
          </div>
        </div>

        {/* VERIFICATION BARRIER VIEW */}
        {isUnverified ? (
          <div className="space-y-4">
            <div className="text-center bg-[#fee2e2] border-2 border-[#ef4444] p-3 shadow-[2px_2px_0px_#000]">
              <span className="font-pixel text-[11px] text-[#b91c1c] block mb-1">
                EMAIL VERIFICATION REQUIRED
              </span>
              <p className="font-silkscreen text-xs text-[#7f1d1d]">
                Verification link sent to:
              </p>
              <div className="font-pixel text-xs text-[#181425] bg-[#fff] border border-[#ef4444] px-2 py-1 my-1 break-all">
                {firebaseUser.email}
              </div>
              <p className="font-silkscreen text-[11px] text-[#7f1d1d] mt-1">
                Click the link in your email, then click below to continue.
              </p>
            </div>

            {feedback && (
              <div className="p-2.5 bg-[#dbeafe] border-2 border-[#3b82f6] text-[#1e40af] font-silkscreen text-xs text-center">
                {feedback}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <PixelButton
                variant="gold"
                size="md"
                className="w-full"
                disabled={loading}
                onClick={handleCheckVerification}
              >
                {loading ? 'CHECKING...' : "⟳ I'VE VERIFIED MY EMAIL"}
              </PixelButton>

              <PixelButton
                variant="parchment"
                size="sm"
                className="w-full"
                disabled={loading}
                onClick={handleResend}
              >
                RESEND VERIFICATION LINK
              </PixelButton>

              <PixelButton
                variant="dark"
                size="sm"
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  chiptune.playCursor();
                  await signOutUser();
                }}
              >
                SIGN OUT
              </PixelButton>
            </div>
          </div>
        ) : (
          /* SIGN IN / REGISTER */
          <div className="space-y-4">
            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-1.5 border-b-2 border-[#d4c5a9] pb-3">
              <button
                type="button"
                onClick={() => {
                  chiptune.playSelect();
                  setMode('LOGIN');
                  clearAuthError();
                  setFeedback(null);
                }}
                className={`py-2 px-1 text-center font-pixel text-[11px] border-2 cursor-pointer transition-colors ${
                  mode === 'LOGIN'
                    ? 'bg-[#201933] text-[#fec83e] border-[#120e1d] shadow-[2px_2px_0px_#000]'
                    : 'bg-[#ede3ce] text-[#4b3e2b] border-[#d4c5a9] hover:bg-[#dfd3bc]'
                }`}
              >
                LOG IN
              </button>
              <button
                type="button"
                onClick={() => {
                  chiptune.playSelect();
                  setMode('REGISTER');
                  clearAuthError();
                  setFeedback(null);
                }}
                className={`py-2 px-1 text-center font-pixel text-[11px] border-2 cursor-pointer transition-colors ${
                  mode === 'REGISTER'
                    ? 'bg-[#201933] text-[#fec83e] border-[#120e1d] shadow-[2px_2px_0px_#000]'
                    : 'bg-[#ede3ce] text-[#4b3e2b] border-[#d4c5a9] hover:bg-[#dfd3bc]'
                }`}
              >
                REGISTER
              </button>
              <button
                type="button"
                onClick={() => {
                  chiptune.playSelect();
                  setMode('RESET');
                  clearAuthError();
                  setFeedback(null);
                }}
                className={`py-2 px-1 text-center font-pixel text-[10px] border-2 cursor-pointer transition-colors ${
                  mode === 'RESET'
                    ? 'bg-[#201933] text-[#fec83e] border-[#120e1d] shadow-[2px_2px_0px_#000]'
                    : 'bg-[#ede3ce] text-[#4b3e2b] border-[#d4c5a9] hover:bg-[#dfd3bc]'
                }`}
              >
                SET PASS
              </button>
            </div>

            {/* Error / Status Feedback */}
            {(authError || feedback) && (
              <div
                className={`p-2.5 border-2 text-center font-silkscreen text-xs ${
                  authError
                    ? 'bg-[#fee2e2] border-[#ef4444] text-[#991b1b]'
                    : 'bg-[#dcfce7] border-[#22c55e] text-[#15803d]'
                }`}
              >
                <div>{authError || feedback}</div>
                {authError && authError.toLowerCase().includes('google') && (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="mt-2 inline-block px-3 py-1 bg-[#181425] text-[#fec83e] font-pixel text-[10px] border border-[#120e1d] cursor-pointer hover:bg-[#201933]"
                  >
                    ▶ SIGN IN WITH GOOGLE
                  </button>
                )}
              </div>
            )}

            {/* GOOGLE AUTHENTICATION */}
            <div>
              <PixelButton
                type="button"
                variant="gold"
                size="md"
                className="w-full flex items-center justify-center gap-2 font-bold shadow-[4px_4px_0px_#120e1d]"
                disabled={loading}
                onClick={handleGoogleSignIn}
              >
                <span className="w-4 h-4 bg-white rounded-full flex items-center justify-center p-0.5 border border-[#120e1d]">
                  <svg viewBox="0 0 24 24" className="w-3 h-3">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </span>
                <span>SIGN IN WITH GOOGLE</span>
              </PixelButton>
            </div>

            {/* DIVIDER */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-0.5 bg-[#d4c5a9]" />
              <span className="font-pixel text-[8px] text-[#71634d] px-2 bg-[#ede3ce] border border-[#d4c5a9]">
                OR WITH EMAIL
              </span>
              <div className="flex-1 h-0.5 bg-[#d4c5a9]" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-pixel text-[10px] text-[#433726] mb-1">
                  EMAIL:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trainer@mail.com"
                  required
                  className="w-full bg-[#fcf8f0] border-2 border-[#120e1d] px-3 py-2 font-silkscreen text-xs text-[#181425] focus:outline-none focus:border-[#e43b44]"
                />
              </div>

              <div>
                <label className="block font-pixel text-[10px] text-[#433726] mb-1">
                  {mode === 'RESET' ? 'NEW PASSWORD:' : 'PASSWORD:'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-[#fcf8f0] border-2 border-[#120e1d] px-3 py-2 font-silkscreen text-xs text-[#181425] focus:outline-none focus:border-[#e43b44]"
                />
                {mode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      chiptune.playSelect();
                      setMode('RESET');
                      clearAuthError();
                      setFeedback(null);
                    }}
                    className="mt-1 text-[10px] text-[#854d0e] hover:text-[#e43b44] underline font-silkscreen block cursor-pointer"
                  >
                    Need to set or reset password? Click here
                  </button>
                )}
              </div>

              {(mode === 'REGISTER' || mode === 'RESET') && (
                <div>
                  <label className="block font-pixel text-[10px] text-[#433726] mb-1">
                    {mode === 'RESET' ? 'CONFIRM NEW PASSWORD:' : 'CONFIRM PASSWORD:'}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-[#fcf8f0] border-2 border-[#120e1d] px-3 py-2 font-silkscreen text-xs text-[#181425] focus:outline-none focus:border-[#e43b44]"
                  />
                </div>
              )}

              <div className="pt-2">
                <PixelButton
                  type="submit"
                  variant="gold"
                  size="md"
                  className="w-full"
                  disabled={loading}
                >
                  {loading
                    ? 'PROCESSING...'
                    : mode === 'LOGIN'
                    ? 'LOG IN ▶'
                    : mode === 'RESET'
                    ? 'SET / UPDATE PASSWORD ▶'
                    : 'CREATE ACCOUNT ▶'}
                </PixelButton>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
