import React, { useState, useEffect } from 'react';

interface RatingNoticeOverlayProps {
  resetTrigger?: number; // Increments on game reset to re-trigger center notice
}

export const RatingNoticeOverlay: React.FC<RatingNoticeOverlayProps> = ({ resetTrigger = 0 }) => {
  const [showCenter, setShowCenter] = useState<boolean>(true);
  const [showRight, setShowRight] = useState<boolean>(false);

  // Trigger 5-second center notice on initial load & whenever game is reset
  useEffect(() => {
    setShowCenter(true);
    const timer = setTimeout(() => {
      setShowCenter(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [resetTrigger]);

  // Trigger 4-second right-side notice every 1 hour (3,600,000 ms) of game play
  useEffect(() => {
    const ONE_HOUR_MS = 3600000;
    const interval = setInterval(() => {
      setShowRight(true);
      const timer = setTimeout(() => {
        setShowRight(false);
      }, 4000);
      return () => clearTimeout(timer);
    }, ONE_HOUR_MS);

    return () => clearInterval(interval);
  }, []);

  if (!showCenter && !showRight) return null;

  return (
    <>
      {/* Center Rating Notice: Minimal horizontal padding (px-1), 5 seconds on Start / Reset */}
      {showCenter && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-3 sm:p-6 bg-black/60 backdrop-blur-[2px] transition-all duration-500 animate-fade-in overflow-hidden">
          <div className="w-full max-w-2xl relative flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden bg-white px-1 py-4 border-2 border-slate-900 drop-shadow-2xl">
            <img
              src="/rating_notice.png"
              alt="12세 이용가 등급 안내"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.endsWith('.png')) {
                  target.src = '/rating_notice.jpg';
                } else if (target.src.endsWith('.jpg')) {
                  target.src = '/rating_notice.svg';
                }
              }}
              className="w-full h-auto max-h-[80vh] object-contain transition-all duration-300"
            />
          </div>
        </div>
      )}

      {/* Right Side Periodic Rating Notice: Top-right corner, height >= 20vh, 4 seconds every 1 hour */}
      {!showCenter && showRight && (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-none transition-all duration-500 animate-fade-in drop-shadow-2xl">
          <div className="relative flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden bg-white p-2 border-2 border-slate-900">
            <img
              src="/rating_notice_badge.png"
              alt="12세 이용가 등급 심의 배지"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.endsWith('.png')) {
                  target.src = '/rating_notice_badge.jpg';
                } else if (target.src.endsWith('.jpg')) {
                  target.src = '/rating_notice_badge.svg';
                }
              }}
              className="h-[22vh] min-h-[20vh] max-h-[35vh] w-auto object-contain transition-all duration-300"
            />
          </div>
        </div>
      )}
    </>
  );
};
