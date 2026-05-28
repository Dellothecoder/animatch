import { useState } from 'react';
import { Lock, Check } from 'lucide-react';
import UnlockCodeInput from './UnlockCodeInput';
import ManualBuilder from './ManualBuilder';

export default function ManualBuilderSection() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('animatch_unlocked') === 'true';
  });

  if (isUnlocked) {
    return (
      <div className="border border-pink-500/20 rounded-2xl p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm">
        <ManualBuilder />
      </div>
    );
  }

  return (
    <div className="relative border border-pink-500/20 rounded-2xl p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-sm">
      {/* Premium badge top right */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-pink-500/20 border border-pink-500/30 rounded-full px-3 py-1">
        <Lock size={10} className="text-pink-400" />
        <span className="text-pink-400 text-xs font-semibold">SUPPORTER</span>
      </div>

      {/* Heading */}
      <h3 className="text-white font-bold text-xl mb-1">Manual Anime Builder</h3>
      <p className="text-gray-400 text-sm mb-5">
        No MyAnimeList account? Add anime you've watched manually and get fully personalised recommendations.
      </p>

      {/* Feature list */}
      <ul className="space-y-2 mb-6">
        {[
          "Add any anime you've watched",
          'Rate them to train your taste profile',
          'Get 20 personalised recommendations',
          'No MAL account needed'
        ].map(feature => (
          <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
            <Check size={14} className="text-pink-400 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      {/* Donate button */}
      <a
        href="https://buymeacoffee.com/animatch"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl mb-4 transition-all duration-200 hover:scale-[1.02]"
      >
        <span>&#9749;</span>
        <span>Support AniMatch ($3+) to Unlock</span>
      </a>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-gray-600 text-xs">already donated?</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Unlock code input */}
      <UnlockCodeInput onUnlock={() => setIsUnlocked(true)} />
    </div>
  );
}
