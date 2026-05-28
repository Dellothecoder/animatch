import { useEffect, useState } from 'react';

const loadingMessages = [
  "Analyzing your anime taste...",
  "Checking your MAL history...",
  "Finding hidden gems for you...",
  "Calculating genre matches...",
  "Filtering out what you've seen...",
  "Almost there...",
  "Consulting the anime gods...",
  "Removing sequels you haven't earned...",
  "Matching your vibe...",
  "Your recommendations are loading...",
];

interface LoadingScreenProps {
  progress: number;
}

export default function LoadingScreen({ progress }: LoadingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 1800);

    return () => clearInterval(messageTimer);
  }, []);

  const displayProgress = Math.min(progress, 95);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {/* Logo area */}
      <div className="relative flex items-center justify-center mb-10">
        {/* Outer spinning ring */}
        <div className="absolute w-28 h-28 rounded-full border-2 border-transparent border-t-pink-500 border-r-pink-500/30 animate-spin" />
        {/* Middle pulsing ring */}
        <div className="absolute w-20 h-20 rounded-full border border-pink-500/20 animate-pulse" />
        {/* Center logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-purple-700 flex items-center justify-center shadow-lg shadow-pink-900/50 animate-pulse">
          <span className="text-white font-bold text-2xl tracking-tight select-none">AM</span>
        </div>
      </div>

      {/* App name */}
      <h1 className="text-white text-2xl font-bold tracking-tight mb-2">
        Ani<span className="text-pink-500">Match</span>
      </h1>

      {/* Cycling message */}
      <div className="h-6 flex items-center justify-center mt-1 mb-10">
        <p key={messageIndex} className="text-gray-400 text-sm sm:text-base text-center max-w-xs animate-fade-in">
          {loadingMessages[messageIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-64 sm:w-80">
        <div className="flex justify-between text-xs text-gray-600 mb-1.5">
          <span>Loading</span>
          <span>{displayProgress}%</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-600 to-purple-400 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
