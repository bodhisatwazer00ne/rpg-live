import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PixelButton } from '../rpg/PixelButton';
import { chiptune } from '../../services/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialMode?: 'LOGIN' | 'REGISTER';
  forceVerificationBarrier?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'LOGIN',
  forceVerificationBarrier = false,
}) => {
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

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'RESET'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [trainerName, setTrainerName] = useState('');
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
      if (onClose) onClose();
    } catch {
      chiptune.playHit();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const showVerificationBarrier = firebaseUser && !isVerified;

  // Handle Escape key to close modal if allowed
  React.useEffect(() => {
    if (!isOpen || !onClose || forceVerificationBarrier) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, forceVerificationBarrier]);

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

    if (mode === 'REGISTER' && !trainerName.trim()) {
      setFeedback('Please choose a username.');
      chiptune.playHit();
      return;
    }

    setLoading(true);
    try {
      if (mode === 'REGISTER') {
        await signUpWithEmail(email, password, trainerName);
        chiptune.playLevelUp();
        setFeedback('Account ready! Welcome, Trainer.');
        if (onClose) onClose();
      } else if (mode === 'RESET') {
        await resetPassword(email, password);
        chiptune.playLevelUp();
        setFeedback('Password updated! Welcome back.');
        if (onClose) onClose();
      } else {
        await signInWithEmail(email, password);
        chiptune.playSelect();
        if (onClose) onClose();
      }
    } catch (err: any) {
      chiptune.playHit();
      setFeedback(err.message || 'Authentication error. Please try again.');
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

  const handleCheckVerification = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const verified = await reloadUserStatus();
      if (verified) {
        chiptune.playLevelUp();
        setFeedback('✓ Email verified!');
        setTimeout(() => {
          if (onClose) onClose();
        }, 500);
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 select-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md border-4 border-[#120e1d] bg-[#f5eedb] p-5 sm:p-6 shadow-[6px_6px_0px_#000] my-8">
        {onClose && !forceVerificationBarrier && (
          <button
            type="button"
            onClick={() => {
              chiptune.playCursor();
              onClose();
            }}
            aria-label="Close authentication modal"
            className="absolute top-3 right-3 w-8 h-8 bg-[#201933] text-[#f4eee3] border-2 border-[#120e1d] flex items-center justify-center font-pixel text-xs hover:bg-[#e43b44] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec83e]"
          >
            ✕
          </button>
        )}

        {/* VERIFICATION BARRIER STATE */}
        {showVerificationBarrier ? (
          <div className="space-y-4">
            <div className="text-center">
              <span id="auth-modal-title" className="inline-block font-pixel text-[10px] bg-[#dc2626] text-white px-2.5 py-1 border border-[#7f1d1d]">
                EMAIL VERIFICATION REQUIRED
              </span>
            </div>

            <div className="bg-[#fff] border-2 border-[#120e1d] p-3 text-center space-y-1">
              <p className="font-silkscreen text-xs text-[#713f12]">
                Verification link sent to:
              </p>
              <div className="font-pixel text-xs text-[#181425] bg-[#fef08a] px-2 py-1 border border-[#ca8a04] break-all">
                {firebaseUser.email}
              </div>
              <p className="font-silkscreen text-[11px] text-[#713f12] mt-1">
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
          /* STANDARD LOGIN / SIGN UP FORM */
          <div className="space-y-4">
            {/* Mode Toggle Tabs */}
            <div className="grid grid-cols-3 gap-1.5 border-b-2 border-[#d4c5a9] pb-2">
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
                SIGN IN
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

            {/* Errors / Feedback */}
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
                className="w-full flex items-center justify-center gap-2 font-bold shadow-[3px_3px_0px_#120e1d]"
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
              <span className="font-pixel text-[8px] text-[#71634d] px-1 bg-[#ede3ce] border border-[#d4c5a9]">
                OR WITH EMAIL
              </span>
              <div className="flex-1 h-0.5 bg-[#d4c5a9]" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'REGISTER' && (
                <div>
                  <label htmlFor="auth-modal-username" className="block font-pixel text-[10px] text-[#433726] mb-1">
                    USERNAME:
                  </label>
                  <input
                    id="auth-modal-username"
                    type="text"
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    placeholder="e.g. ShadowBlade"
                    required
                    maxLength={20}
                    className="w-full bg-[#fcf8f0] border-2 border-[#120e1d] px-3 py-2 font-silkscreen text-xs text-[#181425] focus:outline-none focus:border-[#e43b44]"
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-modal-email" className="block font-pixel text-[10px] text-[#433726] mb-1">
                  EMAIL:
                </label>
                <input
                  id="auth-modal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trainer@domain.com"
                  required
                  className="w-full bg-[#fcf8f0] border-2 border-[#120e1d] px-3 py-2 font-silkscreen text-xs text-[#181425] focus:outline-none focus:border-[#e43b44]"
                />
              </div>

              <div>
                <label htmlFor="auth-modal-password" className="block font-pixel text-[10px] text-[#433726] mb-1">
                  {mode === 'RESET' ? 'NEW PASSWORD:' : 'PASSWORD:'}
                </label>
                <input
                  id="auth-modal-password"
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
                  <label htmlFor="auth-modal-confirm-password" className="block font-pixel text-[10px] text-[#433726] mb-1">
                    {mode === 'RESET' ? 'CONFIRM NEW PASSWORD:' : 'CONFIRM PASSWORD:'}
                  </label>
                  <input
                    id="auth-modal-confirm-password"
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
                    ? 'TRANSMITTING...'
                    : mode === 'LOGIN'
                    ? 'SIGN IN ▶'
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
