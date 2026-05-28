import { useEffect, useRef } from 'react';
import { X, Star, Sparkles } from 'lucide-react';

export interface RecommendationReason {
  matchedGenres: string[];
  basedOn: string[];
  malScore: number;
}

interface Props {
  reason: RecommendationReason;
  animeTitle: string;
  onClose: () => void;
  isMobile: boolean;
}

export default function RecommendationTooltip({ reason, onClose, isMobile }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const panel = (
    <div ref={ref} className="bg-gray-900 border border-pink-500/60 rounded-xl shadow-2xl p-4 w-72 text-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="font-semibold text-white leading-snug">Why recommended?</p>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors flex-shrink-0 mt-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {reason.matchedGenres.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-pink-400 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-medium uppercase tracking-wide">Genre Match</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {reason.matchedGenres.slice(0, 5).map(g => (
              <span key={g} className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs rounded-full border border-pink-500/30">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {reason.basedOn.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1.5">Because you liked</p>
          <ul className="space-y-1">
            {reason.basedOn.map(title => (
              <li key={title} className="text-gray-300 text-xs flex items-start gap-1.5">
                <span className="text-pink-500 mt-0.5">›</span>
                <span className="line-clamp-1">{title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reason.malScore > 0 && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-800">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
          <span className="text-gray-400 text-xs">
            Rated <span className="text-yellow-400 font-semibold">{reason.malScore.toFixed(1)}</span> on MAL
          </span>
        </div>
      )}

      {reason.matchedGenres.length === 0 && reason.basedOn.length === 0 && (
        <p className="text-gray-400 text-xs">Popular anime you might enjoy based on your list.</p>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe-bottom" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <div className="max-w-lg mx-auto">
            <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-3" />
            {panel}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="absolute top-2 right-2 z-20">
      {panel}
    </div>
  );
}
