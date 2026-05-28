import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Layers, Sparkles, ChevronRight } from 'lucide-react';
import ManualBuilderSection from '../components/ManualBuilderSection';

const socialLinks = [
  {
    platform: 'TikTok',
    description: 'Follow AniMatch',
    url: 'https://tiktok.com/@animatch.gg',
    color: '#E91E8C'
  },
  {
    platform: 'Instagram',
    description: 'Follow AniMatch',
    url: 'https://instagram.com/animatch.gg',
    color: '#9B59B6'
  },
{
    platform: 'Buy Me a Coffee',
    description: 'Support AniMatch',
    url: 'https://buymeacoffee.com/animatch',
    color: '#FFDD00'
  }
];

export default function Home() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      navigate(`/recs?user=${encodeURIComponent(username.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
<div className="relative z-10 w-full max-w-2xl text-center">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full text-pink-400 text-xs sm:text-sm mb-8">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            AI-Powered Anime Recommendations
          </div>
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white mb-5"
            style={{ textShadow: '0 0 40px rgba(233,30,140,0.3)' }}
          >
            Ani<span className="text-shimmer">Match</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-md mx-auto leading-relaxed">
            Discover your next favorite anime based on what you already love
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your MAL username"
              className="w-full px-6 py-4 sm:py-5 bg-gray-900/60 border border-gray-700/60 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/50 transition-all text-base sm:text-lg pr-14 backdrop-blur-sm"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500">
              <Search className="w-5 h-5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full py-4 sm:py-5 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-full transition-opacity hover:opacity-90 active:opacity-80 text-base sm:text-lg shadow-lg shadow-pink-900/30"
            style={{ background: 'linear-gradient(135deg, #E91E8C 0%, #9B59B6 100%)' }}
          >
            Get Recommendations
          </button>
        </form>

<p className="mt-5 text-gray-600 text-xs sm:text-sm">
          No account needed. Just your MyAnimeList username.
        </p>

        {/* Or divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-gray-500 text-sm font-medium">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Manual Builder Section */}
        <div className="text-left">
          <ManualBuilderSection />
        </div>

        {/* Stats row */}
        <div className="mt-10 sm:mt-14 grid grid-cols-3 gap-3 sm:gap-4 text-center">
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-800/60">
            <Star className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
            <div className="text-lg sm:text-2xl font-bold text-white mb-0.5">9/10+</div>
            <div className="text-xs text-gray-500 leading-tight">Top picks only</div>
          </div>
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-800/60">
            <Layers className="w-5 h-5 text-pink-400 mx-auto mb-2" />
            <div className="text-lg sm:text-2xl font-bold text-white mb-0.5">5+</div>
            <div className="text-xs text-gray-500 leading-tight">Genres matched</div>
          </div>
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-gray-800/60">
            <Sparkles className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-lg sm:text-2xl font-bold text-white mb-0.5">40</div>
            <div className="text-xs text-gray-500 leading-tight">Recommendations</div>
          </div>
        </div>

        {/* Social links */}
        <div className="mt-10 w-full max-w-2xl mx-auto px-4">
          <p className="text-pink-400 text-xs font-semibold tracking-widest uppercase mb-4 text-center">Follow Along</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-900/50 border border-white/10 rounded-xl p-4 hover:border-pink-500/50 hover:bg-gray-800/50 transition-all duration-200 group"
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: link.color }} />
                <div className="flex-1 text-left">
                  <div className="text-white font-bold text-sm leading-tight">{link.platform}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{link.description}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
