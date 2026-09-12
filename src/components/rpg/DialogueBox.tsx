import React, { useState, useEffect } from 'react';
import { PixelButton } from './PixelButton';
import { chiptune } from '../../services/audio';

interface DialogueBoxProps {
  speakerName?: string;
  avatarIcon?: React.ReactNode;
  text: string;
  onAdvance?: () => void;
  advanceText?: string;
  className?: string;
  autoFocus?: boolean;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  speakerName,
  avatarIcon,
  text,
  onAdvance,
  advanceText = 'CONTINUE',
  className = '',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsTypingComplete(false);
    let index = 0;

    const timer = setInterval(() => {
      index++;
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        if (index % 3 === 0) {
          chiptune.playCursor();
        }
      } else {
        setIsTypingComplete(true);
        clearInterval(timer);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [text]);

  const handleSkip = () => {
    if (!isTypingComplete) {
      setDisplayedText(text);
      setIsTypingComplete(true);
    } else if (onAdvance) {
      chiptune.playSelect();
      onAdvance();
    }
  };

  return (
    <div
      onClick={handleSkip}
      className={`relative cursor-pointer border-4 border-[#120e1d] bg-[#f5eedb] text-[#1c172b] p-3 sm:p-4 shadow-[4px_4px_0px_#120e1d] select-none ${className}`}
    >
      {/* Corner Rivets */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#c8b99d]" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#c8b99d]" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#c8b99d]" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-[#c8b99d]" />

      {/* Speaker Tag */}
      {speakerName && (
        <div className="absolute -top-4 left-4 bg-[#1f192f] text-[#fec83e] font-pixel text-[10px] px-2.5 py-1 border-2 border-[#120e1d] shadow-[2px_2px_0px_#000]">
          {speakerName}
        </div>
      )}

      <div className="flex gap-3 items-start mt-1">
        {avatarIcon && (
          <div className="shrink-0 w-12 h-12 bg-[#e2d5bd] border-2 border-[#120e1d] p-1 flex items-center justify-center shadow-[inset_1px_1px_0px_#fff]">
            {avatarIcon}
          </div>
        )}

        <div className="flex-1">
          <p className="font-silkscreen text-xs sm:text-sm leading-relaxed text-[#1c172b] min-h-[44px]">
            {displayedText}
          </p>
        </div>
      </div>

      {/* Advance Indicator */}
      <div className="flex justify-end items-center mt-2 gap-2">
        {isTypingComplete ? (
          onAdvance ? (
            <PixelButton
              variant="parchment"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                chiptune.playSelect();
                onAdvance();
              }}
            >
              {advanceText} <span className="font-pixel text-xs animate-bounce">▼</span>
            </PixelButton>
          ) : (
            <span className="font-pixel text-[10px] text-[#e43b44] animate-bounce">▼</span>
          )
        ) : (
          <span className="font-pixel text-[9px] opacity-60">CLICK TO SKIP ▶</span>
        )}
      </div>
    </div>
  );
};
