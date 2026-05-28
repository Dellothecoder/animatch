import { useState } from 'react';
import { Share2, Check, Sparkles } from 'lucide-react';

interface TasteProfileCardProps {
  username: string;
  topGenres: string[];
  totalWatched: number;
  averageScore: number;
}

const tasteTypes = [
  { keywords: ['Mystery', 'Psychological', 'Thriller'], label: 'The Dark Thinker' },
  { keywords: ['Action', 'Adventure', 'Shounen'], label: 'The Thrill Seeker' },
  { keywords: ['Romance', 'Drama', 'Shoujo'], label: 'The Hopeless Romantic' },
  { keywords: ['Comedy', 'Slice of Life', 'Iyashikei'], label: 'The Chill Watcher' },
  { keywords: ['Fantasy', 'Isekai', 'Adventure'], label: 'The World Builder' },
  { keywords: ['Horror', 'Supernatural', 'Psychological'], label: 'The Darkness Enjoyer' },
  { keywords: ['Sci-Fi', 'Mecha', 'Space'], label: 'The Future Gazer' },
  { keywords: ['Sports', 'Drama', 'Competition'], label: 'The Underdog Fan' },
  { keywords: ['Ecchi', 'Harem', 'Fan Service'], label: 'The Guilty Pleasure Watcher' },
  { keywords: ['Music', 'Idol', 'Performance'], label: 'The Idol Fan' },
];

function getTasteType(topGenres: string[]): string {
  let bestMatch = { label: 'The Anime Connoisseur', score: 0 };

  for (const type of tasteTypes) {
    const score = type.keywords.filter(k =>
      topGenres.some(g => g.toLowerCase().includes(k.toLowerCase()))
    ).length;

    if (score > bestMatch.score) {
      bestMatch = { label: type.label, score };
    }
  }

  return bestMatch.label;
}

export default function TasteProfileCard({ username, topGenres, totalWatched, averageScore }: TasteProfileCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tasteType = getTasteType(topGenres);
  const displayGenres = topGenres.slice(0, 3);

  return (
    <div className="relative mb-8 rounded-2xl p-[1px] overflow-hidden">
      {/* Animated gradient border */}
      <div className="absolute inset-0 animated-border rounded-2xl" />

      {/* Card content */}
      <div className="relative rounded-2xl bg-gray-900/95 p-5 sm:p-7 overflow-hidden">
        {/* Background pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Decorative glows */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-purple-500/5 blur-2xl" />

        <div className="relative">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-pink-400 uppercase tracking-widest">
                Taste Profile
              </span>
            </div>

            <button
              onClick={handleShare}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#FFDD00' }}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </>
              )}
            </button>
          </div>

          {/* Taste type */}
          <p className="text-gray-400 text-sm mb-1">{username} is</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
            <span className="text-pink-400">{tasteType}</span>
          </h2>

          {/* Genre pills */}
          {displayGenres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {displayGenres.map(genre => (
                <span
                  key={genre}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-pink-500/20 text-pink-400 border border-pink-500/30"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[100px] rounded-xl bg-gray-800/50 border border-gray-700/40 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-white">{totalWatched.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">Watched</p>
            </div>
            <div className="flex-1 min-w-[100px] rounded-xl bg-gray-800/50 border border-gray-700/40 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-white">{averageScore > 0 ? averageScore.toFixed(1) : '-'}</p>
              <p className="text-xs text-gray-500 mt-0.5">Avg Score</p>
            </div>
            <div className="flex-1 min-w-[100px] rounded-xl bg-gray-800/50 border border-gray-700/40 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-white">{displayGenres.length > 0 ? displayGenres[0] : '-'}</p>
              <p className="text-xs text-gray-500 mt-0.5">Top Genre</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
