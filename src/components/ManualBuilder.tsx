import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X, Sparkles } from 'lucide-react';

interface AnimeSearchResult {
  id: number;
  title: string;
  main_picture?: { medium: string; large: string };
  genres?: Array<{ id: number; name: string }>;
  mean?: number;
  num_episodes?: number;
}

interface ManimeEntry {
  malId: number;
  title: string;
  coverImage: string;
  genres: Array<{ id: number; name: string }>;
  meanScore: number;
  userScore: number;
  episodes: number;
}

export default function ManualBuilder() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AnimeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [myList, setMyList] = useState<ManimeEntry[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchAnime = async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mal-search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await res.json();
      setSearchResults(data.results || []);
      setShowDropdown(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchAnime(searchQuery);
      else { setSearchResults([]); setShowDropdown(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addAnime = (anime: AnimeSearchResult) => {
    if (myList.some(a => a.malId === anime.id)) return;

    setMyList(prev => [...prev, {
      malId: anime.id,
      title: anime.title,
      coverImage: anime.main_picture?.medium || '',
      genres: anime.genres || [],
      meanScore: anime.mean || 0,
      userScore: 7,
      episodes: anime.num_episodes || 0,
    }]);

    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const removeAnime = (malId: number) => {
    setMyList(prev => prev.filter(a => a.malId !== malId));
  };

  const updateRating = (malId: number, score: number) => {
    setMyList(prev => prev.map(a =>
      a.malId === malId ? { ...a, userScore: score } : a
    ));
  };

  const handleGetRecommendations = () => {
    const formattedList = myList.map(anime => ({
      node: {
        id: anime.malId,
        title: anime.title,
        genres: anime.genres,
        mean: anime.meanScore,
      },
      list_status: {
        score: anime.userScore,
        status: 'completed'
      }
    }));

    navigate('/recs?user=Manual+List', {
      state: {
        manualList: formattedList,
        isManual: true,
        username: 'Manual List'
      }
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-white font-bold text-xl">Manual Anime Builder</h3>
        <p className="text-gray-400 text-sm mt-1">
          Add anime you've watched and rate them. Add at least 10 for best results.
        </p>
      </div>

      {/* Search bar with dropdown */}
      <div className="relative z-50">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
            placeholder="Search anime to add..."
            className="w-full bg-gray-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-pink-500/50 focus:outline-none transition-colors"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-white/10 rounded-xl overflow-hidden z-[999] shadow-2xl max-h-80 overflow-y-auto">
            {searchResults.map(anime => (
              <button
                key={anime.id}
                onClick={() => addAnime(anime)}
                disabled={myList.some(a => a.malId === anime.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {anime.main_picture?.medium ? (
                  <img
                    src={anime.main_picture.medium}
                    alt={anime.title}
                    className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-14 bg-gray-800 rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{anime.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    MAL Score: {anime.mean?.toFixed(1) || 'N/A'} &bull; {anime.num_episodes || '?'} eps
                  </p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {anime.genres?.slice(0, 3).map(g => (
                      <span key={g.id} className="text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full px-2 py-0.5">
                        {g.name}
                      </span>
                    ))}
                  </div>
                </div>
                <Plus size={16} className="text-pink-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* My list */}
      {myList.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
            Your list ({myList.length}/10 minimum)
          </p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {myList.map(anime => (
              <div
                key={anime.malId}
                className="flex items-center gap-3 bg-gray-800/50 border border-white/5 rounded-xl p-3"
              >
                {anime.coverImage ? (
                  <img
                    src={anime.coverImage}
                    alt={anime.title}
                    className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-14 bg-gray-700 rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{anime.title}</p>

                  {/* Rating selector */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {[1,2,3,4,5,6,7,8,9,10].map(score => (
                      <button
                        key={score}
                        onClick={() => updateRating(anime.malId, score)}
                        className={`w-6 h-6 rounded-md text-xs font-bold transition-all ${
                          anime.userScore === score
                            ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white scale-110'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => removeAnime(anime.malId)}
                  className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {myList.length === 0 && (
        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
          <p className="text-gray-600 text-sm">Search for anime you've watched and add them here</p>
          <p className="text-gray-700 text-xs mt-1">Add at least 10 for accurate recommendations</p>
        </div>
      )}

      {/* Progress bar */}
      {myList.length > 0 && myList.length < 10 && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{myList.length}/10 anime added</span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full transition-all duration-500"
              style={{ width: `${(myList.length / 10) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Get recommendations button */}
      {myList.length >= 10 && (
        <button
          onClick={handleGetRecommendations}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity text-lg flex items-center justify-center gap-2"
        >
          <Sparkles size={20} />
          Get My Recommendations
        </button>
      )}
    </div>
  );
}
