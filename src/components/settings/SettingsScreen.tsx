import React, { useState } from 'react';
import { GameSettings, User } from '../../types';
import { RpgWindow } from '../rpg/RpgWindow';
import { PixelButton } from '../rpg/PixelButton';
import { chiptune } from '../../services/audio';
import { useAuth } from '../../context/AuthContext';
import { checkUsernameAvailable } from '../../services/firebase';

interface SettingsScreenProps {
  settings: GameSettings;
  user: User;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onUpdateUserProfile: (updates: { username: string; title: string }) => Promise<void>;
  onResetGame: () => void;
  onExportSave?: () => string;
  onImportSave?: (jsonStr: string) => boolean;
  onOpenAuthModal?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  user,
  onUpdateSettings,
  onUpdateUserProfile,
  onResetGame,
  onOpenAuthModal,
}) => {
  const { firebaseUser, isVerified, signOutUser } = useAuth();
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Profile editing state
  const [usernameInput, setUsernameInput] = useState<string>(user.username || '');
  const [mottoInput, setMottoInput] = useState<string>(user.title || 'Blank Slate & Pure Potential');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [checkingUsername, setCheckingUsername] = useState<boolean>(false);
  const [usernameStatus, setUsernameStatus] = useState<{ type: 'available' | 'taken' | 'unchanged' | 'invalid'; label: string } | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSoundToggle = () => {
    const next = !settings.soundEnabled;
    chiptune.isEnabled = next;
    onUpdateSettings({ soundEnabled: next });
    if (next) chiptune.playSelect();
  };

  const handleCrtToggle = () => {
    chiptune.playSelect();
    onUpdateSettings({ crtFilterEnabled: !settings.crtFilterEnabled });
  };

  const handleCheckUsername = async () => {
    const clean = usernameInput.trim();
    if (!clean || clean.length < 3 || clean.length > 20) {
      setUsernameStatus({ type: 'invalid', label: '3-20 CHARS' });
      chiptune.playHit();
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
      setUsernameStatus({ type: 'invalid', label: 'LETTERS/NUMBERS ONLY' });
      chiptune.playHit();
      return;
    }
    if (clean.toLowerCase() === (user.username || '').toLowerCase()) {
      setUsernameStatus({ type: 'unchanged', label: 'CURRENT NAME' });
      return;
    }

    setCheckingUsername(true);
    try {
      const res = await checkUsernameAvailable(clean, firebaseUser?.uid);
      if (res.available) {
        setUsernameStatus({ type: 'available', label: '✓ AVAILABLE' });
        chiptune.playSelect();
      } else {
        setUsernameStatus({ type: 'taken', label: res.error ? '✕ TAKEN' : '✕ TAKEN' });
        chiptune.playHit();
      }
    } catch {
      setUsernameStatus({ type: 'invalid', label: 'CHECK FAILED' });
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);

    const cleanUser = usernameInput.trim();
    const cleanMotto = mottoInput.trim() || 'Blank Slate & Pure Potential';

    if (!cleanUser || cleanUser.length < 3 || cleanUser.length > 20) {
      setProfileFeedback({ type: 'error', message: 'Username must be between 3 and 20 characters.' });
      chiptune.playHit();
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUser)) {
      setProfileFeedback({ type: 'error', message: 'Username can only contain letters, numbers, hyphens, and underscores.' });
      chiptune.playHit();
      return;
    }

    setSavingProfile(true);
    try {
      await onUpdateUserProfile({
        username: cleanUser,
        title: cleanMotto,
      });
      chiptune.playLevelUp();
      setProfileFeedback({
        type: 'success',
        message: '✓ Profile updated! Saved across arena & rankings.',
      });
      setUsernameStatus({ type: 'unchanged', label: 'CURRENT NAME' });
    } catch (err: any) {
      chiptune.playHit();
      setProfileFeedback({
        type: 'error',
        message: err.message || 'Failed to update profile. Please try again.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#f5eedb] border-4 border-[#120e1d] p-3 shadow-[4px_4px_0px_#120e1d]">
        <h2 className="font-pixel text-base sm:text-lg text-[#181425]">
          CONFIGURATION
        </h2>
      </div>

      <div className="space-y-4">
        {/* Trainer Profile (Username & Motto) */}
        <RpgWindow variant="parchment" title="TRAINER PROFILE">
          <form onSubmit={handleSaveProfile} className="space-y-3 font-pixel text-xs">
            {/* Username Input */}
            <div className="p-3 bg-[#fcf8f0] border-2 border-[#120e1d] space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="config-username-input" className="text-[#181425] block font-bold">
                  USERNAME
                </label>
                {usernameStatus && (
                  <span className={`font-pixel text-[9px] px-2 py-0.5 border ${
                    usernameStatus.type === 'available'
                      ? 'bg-[#dcfce7] border-[#86efac] text-[#15803d]'
                      : usernameStatus.type === 'taken'
                      ? 'bg-[#fee2e2] border-[#fca5a5] text-[#b91c1c]'
                      : usernameStatus.type === 'unchanged'
                      ? 'bg-[#e0e7ff] border-[#c7d2fe] text-[#3730a3]'
                      : 'bg-[#fef3c7] border-[#fde047] text-[#92400e]'
                  }`}>
                    {usernameStatus.label}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  id="config-username-input"
                  type="text"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setUsernameStatus(null);
                  }}
                  maxLength={20}
                  placeholder="3-20 chars"
                  className="flex-1 bg-white border-2 border-[#120e1d] px-3 py-1.5 font-pixel text-xs text-[#181425] focus:outline-none focus:bg-[#fef9c3]"
                />
                <button
                  type="button"
                  onClick={handleCheckUsername}
                  disabled={checkingUsername || !usernameInput.trim()}
                  className="px-3 py-1.5 bg-[#e2d8c3] border-2 border-[#120e1d] text-[10px] hover:bg-[#fff] font-pixel cursor-pointer disabled:opacity-50"
                >
                  {checkingUsername ? '...' : 'CHECK'}
                </button>
              </div>
            </div>

            {/* Motto Input */}
            <div className="p-3 bg-[#fcf8f0] border-2 border-[#120e1d] space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="config-motto-input" className="text-[#181425] block font-bold">
                  MOTTO
                </label>
                <span className="font-silkscreen text-[10px] text-[#716652]">
                  {mottoInput.length}/40
                </span>
              </div>
              <input
                id="config-motto-input"
                type="text"
                value={mottoInput}
                onChange={(e) => setMottoInput(e.target.value)}
                maxLength={40}
                placeholder="e.g. Blank Slate & Pure Potential"
                className="w-full bg-white border-2 border-[#120e1d] px-3 py-1.5 font-pixel text-xs text-[#181425] focus:outline-none focus:bg-[#fef9c3]"
              />
            </div>

            {/* Feedback alert */}
            {profileFeedback && (
              <div className={`p-2.5 border-2 font-silkscreen text-xs text-center ${
                profileFeedback.type === 'success'
                  ? 'bg-[#dcfce7] border-[#22c55e] text-[#15803d]'
                  : 'bg-[#fee2e2] border-[#ef4444] text-[#b91c1c]'
              }`}>
                {profileFeedback.message}
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-1">
              <PixelButton
                type="submit"
                variant="gold"
                size="md"
                disabled={savingProfile}
              >
                {savingProfile ? 'SAVING...' : 'SAVE PROFILE'}
              </PixelButton>
            </div>
          </form>
        </RpgWindow>

        {/* User Account & Cloud Sync */}
        <RpgWindow variant="parchment" title="ACCOUNT & CLOUD SYNC">
          <div className="space-y-3 font-pixel text-xs">
            {firebaseUser ? (
              <div className="p-3 bg-[#fcf8f0] border-2 border-[#120e1d]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[#181425] block font-bold">
                      LOGGED IN: {firebaseUser.email}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {isVerified ? (
                        <span className="font-pixel text-[9px] bg-[#dcfce7] text-[#15803d] px-2 py-0.5 border border-[#86efac]">
                          ✓ VERIFIED
                        </span>
                      ) : (
                        <span className="font-pixel text-[9px] bg-[#fee2e2] text-[#b91c1c] px-2 py-0.5 border border-[#fca5a5]">
                          ⚠ UNVERIFIED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isVerified && onOpenAuthModal && (
                      <PixelButton
                        variant="gold"
                        size="sm"
                        onClick={() => {
                          chiptune.playSelect();
                          onOpenAuthModal();
                        }}
                      >
                        VERIFY EMAIL
                      </PixelButton>
                    )}
                    <PixelButton
                      variant="dark"
                      size="sm"
                      onClick={async () => {
                        chiptune.playCursor();
                        await signOutUser();
                      }}
                    >
                      LOGOUT
                    </PixelButton>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#fcf8f0] border-2 border-[#120e1d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[#181425] block font-bold">
                    LOCAL STORAGE
                  </span>
                </div>

                {onOpenAuthModal && (
                  <PixelButton
                    variant="gold"
                    size="sm"
                    onClick={() => {
                      chiptune.playSelect();
                      onOpenAuthModal();
                    }}
                  >
                    SIGN IN / REGISTER
                  </PixelButton>
                )}
              </div>
            )}
          </div>
        </RpgWindow>

        {/* Audio & Display */}
        <RpgWindow variant="parchment" title="AUDIO & DISPLAY">
          <div className="space-y-3 font-pixel text-xs">
            {/* Sound FX */}
            <div className="p-3 bg-[#fcf8f0] border-2 border-[#120e1d] flex items-center justify-between">
              <div>
                <span className="text-[#181425] block font-bold">CHIPTUNE AUDIO FX</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => chiptune.playAttack()}
                  className="px-2 py-1 text-[9px] bg-[#e2d8c3] border border-[#120e1d] hover:bg-[#fff] cursor-pointer"
                >
                  TEST
                </button>
                <PixelButton
                  variant={settings.soundEnabled ? 'green' : 'parchment'}
                  size="sm"
                  onClick={handleSoundToggle}
                >
                  {settings.soundEnabled ? 'ON' : 'OFF'}
                </PixelButton>
              </div>
            </div>

            {/* CRT Filter */}
            <div className="p-3 bg-[#fcf8f0] border-2 border-[#120e1d] flex items-center justify-between">
              <div>
                <span className="text-[#181425] block font-bold">CRT FILTER</span>
              </div>
              <PixelButton
                variant={settings.crtFilterEnabled ? 'blue' : 'parchment'}
                size="sm"
                onClick={handleCrtToggle}
              >
                {settings.crtFilterEnabled ? 'ON' : 'OFF'}
              </PixelButton>
            </div>
          </div>
        </RpgWindow>

        {/* Adventure Controls / Reset */}
        <RpgWindow variant="parchment" title="RESET">
          <div className="p-3 bg-[#fcf8f0] border-2 border-[#120e1d] flex items-center justify-between font-pixel text-xs">
            <div>
              <span className="text-[#b91c1c] block font-bold">
                RESET CHARACTER
              </span>
            </div>

            <PixelButton
              variant="red"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
            >
              RESET
            </PixelButton>
          </div>
        </RpgWindow>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none backdrop-blur-xs">
          <div className="relative w-full max-w-sm border-4 border-[#120e1d] bg-[#f5eedb] p-5 shadow-[6px_6px_0px_#000]">
            <h3 className="font-pixel text-sm text-[#b91c1c] text-center mb-2">
              CONFIRM HARD RESET?
            </h3>
            <p className="font-silkscreen text-xs text-[#554a37] text-center mb-4 leading-relaxed">
              This will permanently delete your character, completed quests, and unlocked badges.
            </p>
            <div className="flex gap-2">
              <PixelButton
                variant="parchment"
                size="md"
                className="flex-1"
                onClick={() => setShowResetConfirm(false)}
              >
                CANCEL
              </PixelButton>
              <PixelButton
                variant="red"
                size="md"
                className="flex-1"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetGame();
                }}
              >
                ERASE ALL
              </PixelButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
