import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PixelButton } from '../rpg/PixelButton';
import { chiptune } from '../../services/audio';

interface AccountHeaderWidgetProps {
  onOpenAuthModal: () => void;
}

export const AccountHeaderWidget: React.FC<AccountHeaderWidgetProps> = ({ onOpenAuthModal }) => {
  const { firebaseUser, isVerified, signOutUser } = useAuth();

  if (!firebaseUser) {
    return (
      <PixelButton
        variant="gold"
        size="sm"
        onClick={() => {
          chiptune.playSelect();
          onOpenAuthModal();
        }}
      >
        👤 SIGN IN / REGISTER
      </PixelButton>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-[#201933] border-2 border-[#120e1d] px-2.5 py-1 text-[#f4eee3] shadow-[2px_2px_0px_#000]">
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className="font-pixel text-[9px] text-[#fec83e] truncate max-w-[110px] sm:max-w-[160px]">
            {firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Trainer'}
          </span>
          {isVerified ? (
            <span className="font-pixel text-[8px] bg-[#15803d] text-white px-1 border border-[#16a34a]">
              VERIFIED
            </span>
          ) : (
            <button
              onClick={() => {
                chiptune.playCursor();
                onOpenAuthModal();
              }}
              className="font-pixel text-[8px] bg-[#dc2626] text-white px-1 border border-[#ef4444] animate-pulse cursor-pointer hover:bg-[#b91c1c]"
            >
              ⚠ VERIFY MAIL
            </button>
          )}
        </div>
        <span className="font-silkscreen text-[8px] text-[#9ca3af] truncate max-w-[110px] sm:max-w-[160px]">
          {firebaseUser.email}
        </span>
      </div>

      <button
        onClick={async () => {
          chiptune.playCursor();
          await signOutUser();
        }}
        title="Sign Out"
        className="ml-1 text-[#e43b44] hover:text-[#f87171] font-pixel text-[9px] border border-[#374151] px-1.5 py-0.5 bg-[#111827] cursor-pointer"
      >
        LOGOUT
      </button>
    </div>
  );
};
