import React, { useState, useEffect } from 'react';
import { PixelButton } from '../rpg/PixelButton';
import { CharacterSprite } from '../rpg/CharacterSprite';
import { checkUsernameAvailable, claimUniqueUsername } from '../../services/firebase';
import { chiptune } from '../../services/audio';

interface ClaimUsernameModalProps {
  userId: string;
  currentUsername?: string;
  onClaimSuccess: (username: string, avatarId: string) => void;
  onSignOut?: () => void;
}

const AVATAR_CHOICES = [
  { id: 'hero_novice', label: 'Adventurer' },
  { id: 'hero_warrior', label: 'Warrior' },
  { id: 'hero_scholar', label: 'Scholar' },
  { id: 'hero_scout', label: 'Scout' },
  { id: 'hero_guardian', label: 'Guardian' },
  { id: 'hero_monk', label: 'Monk' },
];

export const ClaimUsernameModal: React.FC<ClaimUsernameModalProps> = ({
  userId,
  currentUsername = '',
  onClaimSuccess,
  onSignOut,
}) => {
  const [username, setUsername] = useState(currentUsername === 'Trainer' ? '' : currentUsername);
  const [selectedAvatar, setSelectedAvatar] = useState('hero_novice');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  // Debounced check username availability across ALL accounts
  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 3) {
      setIsAvailable(null);
      setErrorMessage(null);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setIsAvailable(false);
      setErrorMessage('Only letters, numbers, underscores, and hyphens are allowed.');
      return;
    }

    setIsChecking(true);
    setErrorMessage(null);

    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailable(trimmed, userId);
        setIsAvailable(res.available);
        if (res.available) {
          setErrorMessage(null);
        } else {
          setErrorMessage(res.error || `"${trimmed}" is already claimed by another trainer account.`);
        }
      } catch {
        setIsAvailable(false);
        setErrorMessage('Could not verify availability with guild servers.');
      } finally {
        setIsChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, userId]);

  const handleClaim = async () => {
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      chiptune.playHit();
      return;
    }

    if (isAvailable === false) {
      chiptune.playHit();
      return;
    }

    setIsClaiming(true);
    setErrorMessage(null);

    try {
      const res = await claimUniqueUsername(userId, trimmed);
      if (res.success) {
        chiptune.playLevelUp();
        onClaimSuccess(trimmed, selectedAvatar);
      } else {
        chiptune.playHit();
        setErrorMessage(res.error || 'Failed to claim username.');
        setIsAvailable(false);
      }
    } catch {
      chiptune.playHit();
      setErrorMessage('Network error while claiming username. Try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 select-none font-silkscreen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-username-title"
    >
      <div className="relative w-full max-w-md border-4 border-[#120e1d] bg-[#f5eedb] p-5 sm:p-6 shadow-[8px_8px_0px_#000]">
        <div className="text-center mb-4">
          <h2 id="claim-username-title" className="font-pixel text-base sm:text-lg text-[#181425]">
            CHOOSE USERNAME
          </h2>
        </div>

        {/* Input field */}
        <div className="space-y-4 mb-4">
          <div>
            <label htmlFor="claim-username-input" className="block font-pixel text-[10px] text-[#433726] mb-1">
              USERNAME:
            </label>
            <div className="relative">
              <input
                id="claim-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                placeholder="Enter username"
                maxLength={20}
                className="w-full bg-[#fcf8f0] border-2 border-[#120e1d] px-3 py-2 font-silkscreen text-xs text-[#181425] focus:outline-none focus:border-[#e43b44]"
              />
              {isChecking && (
                <span className="absolute right-3 top-2.5 font-pixel text-[10px] text-[#6b7280] animate-pulse">
                  CHECKING...
                </span>
              )}
            </div>

            {/* Availability feedback */}
            {username.trim().length >= 3 && !isChecking && (
              <div className="mt-1.5" aria-live="polite">
                {isAvailable ? (
                  <span className="font-pixel text-[10px] text-[#16a34a] bg-[#dcfce7] border border-[#86efac] px-2 py-0.5 inline-block">
                    ✓ Available
                  </span>
                ) : (
                  <span className="font-pixel text-[10px] text-[#dc2626] bg-[#fee2e2] border border-[#fca5a5] px-2 py-0.5 inline-block">
                    ✕ {errorMessage || 'Unavailable'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Starter Avatar Selection */}
          <div>
            <label className="block font-pixel text-[10px] text-[#433726] mb-1.5">
              AVATAR:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {AVATAR_CHOICES.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  aria-pressed={selectedAvatar === choice.id}
                  aria-label={`Select ${choice.label} avatar`}
                  onClick={() => {
                    chiptune.playCursor();
                    setSelectedAvatar(choice.id);
                  }}
                  className={`p-2 border-2 flex flex-col items-center gap-1 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec83e] ${
                    selectedAvatar === choice.id
                      ? 'bg-[#201933] border-[#fec83e] text-[#fec83e] shadow-[2px_2px_0px_#000]'
                      : 'bg-[#ede3ce] border-[#d4c5a9] text-[#554a37] hover:bg-[#dfd3bc]'
                  }`}
                >
                  <CharacterSprite id={choice.id} size={36} />
                  <span className="font-pixel text-[8px] truncate max-w-full">
                    {choice.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <PixelButton
            variant="green"
            size="md"
            className="w-full"
            disabled={!username.trim() || !isAvailable || isChecking || isClaiming}
            onClick={handleClaim}
          >
            {isClaiming ? 'CONFIRMING...' : '⚔ CONFIRM & ENTER ▶'}
          </PixelButton>
        </div>

        {onSignOut && (
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => {
                chiptune.playSelect();
                onSignOut();
              }}
              className="font-silkscreen text-[11px] text-[#71634d] hover:text-[#181425] underline cursor-pointer"
            >
              Sign out / Log in with different account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
