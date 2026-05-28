import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Star, Tv, Filter, ChevronDown, AlertCircle, Info, Link2, Check, ExternalLink } from 'lucide-react';
import RecommendationTooltip, { RecommendationReason } from '../components/RecommendationTooltip';
import TasteProfileCard from '../components/TasteProfileCard';
import LoadingScreen from '../components/LoadingScreen';

type MediaType = 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music' | 'unknown';

interface Anime {
  node: {
    id: number;
    title: string;
    main_picture?: {
      medium: string;
      large: string;
    };
    genres?: Array<{ id: number; name: string }>;
    mean?: number;
    num_episodes?: number;
    media_type?: MediaType;
  };
  matchScore?: number;
  genreScore?: number;
  reason?: RecommendationReason;
}

interface ResultsData {
  recommendations: Anime[];
  tasteProfile: Record<string, number>;
  topGenres: string[];
  totalWatched: number;
  averageScore: number;
  watchedIds: number[];
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
    if (score > bestMatch.score) bestMatch = { label: type.label, score };
  }
  return bestMatch.label;
}

function updateSEO(username: string, topGenres: string[]) {
  const tasteType = getTasteType(topGenres);
  const genreList = topGenres.slice(0, 3).join(', ');

  document.title = `${username}'s Anime Recommendations — AniMatch`;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content',
      `Personalized anime recommendations for ${username}. Taste type: ${tasteType}. Top genres: ${genreList}. Powered by AniMatch.`
    );
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', `${username}'s Anime Recommendations — AniMatch`);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) {
    ogDesc.setAttribute('content',
      `Personalized anime recommendations for ${username}. Taste type: ${tasteType}. Top genres: ${genreList}. Powered by AniMatch.`
    );
  }

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', window.location.href);
}

function resetSEO() {
  document.title = 'AniMatch — Personalized Anime Recommendations Based on Your MAL List';

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content',
      'Get personalized anime recommendations based on your MyAnimeList watch history. AniMatch analyzes your ratings, genres and taste to find anime you\'ll love that you haven\'t seen yet. Free, instant, no account needed.'
    );
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', 'AniMatch — Personalized Anime Recommendations Based on Your MAL List');

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', 'https://getanimatch.vercel.app');
}

export default function Results() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { manualList, isManual } = (location.state || {}) as { manualList?: any[]; isManual?: boolean };
  const username = isManual ? 'Your Manual List' : (searchParams.get('user') || '');

  const [data, setData] = useState<ResultsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [mediaFilter, setMediaFilter] = useState<'tv' | 'movies-ovas' | 'all'>('tv');
  const [sortBy, setSortBy] = useState<'match' | 'score'>('match');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    return () => { resetSEO(); };
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setProgress(0);

      const progressTimer = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 95));
      }, 80);

      try {
        let result;

        if (isManual && manualList) {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mal-manual`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ animeList: manualList }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'api_error');
          }

          result = await response.json();
        } else {
          const MAL_CLIENT_ID = import.meta.env.VITE_MAL_CLIENT_ID;

          if (!MAL_CLIENT_ID) {
            clearInterval(progressTimer);
            setError('MAL Client ID not configured. Please add VITE_MAL_CLIENT_ID to your .env file.');
            setLoading(false);
            return;
          }

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mal?username=${encodeURIComponent(username)}&client_id=${encodeURIComponent(MAL_CLIENT_ID)}`,
            {
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'api_error');
          }

          result = await response.json();
        }

        clearInterval(progressTimer);
        setProgress(100);
        setData(result);
        if (!isManual) updateSEO(username, result.topGenres ?? []);
      } catch (err) {
        clearInterval(progressTimer);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  const topGenres = data?.topGenres ?? [];

  const allGenres = useMemo(() => {
    if (!data?.recommendations) return [];
    const genres = new Set<string>();
    data.recommendations.forEach(anime => {
      anime.node.genres?.forEach(g => genres.add(g.name));
    });
    return ['All', ...Array.from(genres).sort()];
  }, [data]);

  const filteredAnime = useMemo(() => {
    if (!data?.recommendations) return [];

    let result = [...data.recommendations];

    if (mediaFilter === 'tv') {
      result = result.filter(a => a.node.media_type === 'tv' || a.node.media_type === 'ona');
    } else if (mediaFilter === 'movies-ovas') {
      result = result.filter(a => a.node.media_type === 'movie' || a.node.media_type === 'ova' || a.node.media_type === 'special');
    }

    if (selectedGenre !== 'All') {
      result = result.filter(anime =>
        anime.node.genres?.some(g => g.name === selectedGenre)
      );
    }

    if (sortBy === 'match') {
      result.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else {
      result.sort((a, b) => (b.node.mean || 0) - (a.node.mean || 0));
    }

    return result;
  }, [data, selectedGenre, mediaFilter, sortBy]);

  if (loading) {
    return <LoadingScreen progress={progress} />;
  }

  if (error) {
    const errorMessages: Record<string, { title: string; body: string }> = {
      private_list: {
        title: 'List is private',
        body: "This user's anime list is set to private on MAL. Ask them to make it public in their MAL settings.",
      },
      user_not_found: {
        title: 'Username not found',
        body: "We couldn't find that MAL username. Double check the spelling and try again.",
      },
      rate_limit: {
        title: 'Too many requests',
        body: 'Too many requests right now — wait a few seconds and try again.',
      },
      api_error: {
        title: 'Connection issue',
        body: 'Something went wrong connecting to MyAnimeList. Try again in a moment.',
      },
    };

    const { title, body } = errorMessages[error] ?? errorMessages['api_error'];

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 sm:p-8 text-center border border-gray-800">
          <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
          <p className="text-gray-400 leading-relaxed mb-7">{body}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  const starterAnimePool = [
    { id: 5114, title: 'Fullmetal Alchemist: Brotherhood', genre: 'Action · Adventure', score: '9.1' },
    { id: 16498, title: 'Attack on Titan', genre: 'Action · Drama', score: '9.0' },
    { id: 1535, title: 'Death Note', genre: 'Mystery · Thriller', score: '8.6' },
    { id: 9253, title: 'Steins;Gate', genre: 'Sci-Fi · Drama', score: '9.1' },
    { id: 11061, title: 'Hunter x Hunter (2011)', genre: 'Action · Adventure', score: '9.0' },
    { id: 22319, title: 'Tokyo Ghoul', genre: 'Action · Horror', score: '7.8' },
    { id: 20, title: 'Naruto', genre: 'Action · Adventure', score: '7.9' },
    { id: 21, title: 'One Piece', genre: 'Action · Adventure', score: '8.7' },
  ];

  if (data && data.totalWatched < 10) {
    const watchedIdSet = new Set(data.watchedIds ?? []);
    const starterAnime = starterAnimePool
      .filter(anime => !watchedIdSet.has(anime.id))
      .slice(0, 4);
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-purple-700 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-900/50">
            <span className="text-white font-bold text-2xl">AM</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Your list is just getting started!</h2>
          <p className="text-gray-400 leading-relaxed mb-2">
            Watch and rate at least <span className="text-white font-medium">10 anime</span> on your MAL profile to unlock personalized recommendations.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Right now you have <span className="text-gray-300">{data.totalWatched}</span> anime tracked. Keep going!
          </p>

          <h3 className="text-left text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Great anime to start with</h3>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {starterAnime.map(anime => (
              <a
                key={anime.id}
                href={`https://myanimelist.net/anime/${anime.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-900 border border-gray-800 hover:border-pink-500/60 rounded-xl p-4 text-left transition-all group"
              >
                <p className="text-white font-semibold text-sm mb-1 group-hover:text-pink-400 transition-colors">{anime.title}</p>
                <p className="text-gray-500 text-xs mb-1">{anime.genre}</p>
                <div className="flex items-center gap-1 text-yellow-400 text-xs">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{anime.score}</span>
                </div>
              </a>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://myanimelist.net/profile/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Add anime on MAL
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-full max-w-screen-xl mx-auto px-4 py-6 sm:py-8">

        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 sm:gap-3 mb-2">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
              {isManual ? (
                <>Recommendations for <span className="text-pink-500">Your Manual List</span></>
              ) : (
                <>Recommendations for <span className="text-pink-500 break-all">{username}</span></>
              )}
            </h1>

            {isManual && (
              <span className="text-xs bg-pink-500/20 border border-pink-500/30 text-pink-400 rounded-full px-3 py-1 font-medium">
                Manual Mode
              </span>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {!isManual && (
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all text-sm font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5" />
                      Copy Link
                    </>
                  )}
                </button>
              )}
              <a
                href="https://buymeacoffee.com/animatch"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-black transition-opacity opacity-60 hover:opacity-90"
                style={{ backgroundColor: '#FFDD00' }}
              >
                Buy me a coffee
              </a>
            </div>
          </div>

          {/* Red accent line */}
          <div className="w-16 h-0.5 bg-pink-500 rounded-full mt-2 mb-2" />

          <p className="text-gray-400 text-sm">
            {filteredAnime.length} anime picked just for you
          </p>
        </header>

        {/* Taste Profile Card */}
        {data && (
          <TasteProfileCard
            username={username}
            topGenres={topGenres}
            totalWatched={data.totalWatched}
            averageScore={data.averageScore}
          />
        )}

        {/* Filters */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 w-full sm:w-auto bg-gray-900/60 hover:bg-gray-800 border border-gray-800 rounded-lg text-white transition-colors text-sm"
          >
            <Filter className="w-4 h-4" />
            Filters & Sort
            <ChevronDown className={`w-4 h-4 transition-transform ml-auto sm:ml-0 ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="mt-3 p-4 bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800 flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Type</label>
                <div className="flex gap-2 flex-wrap">
                  {(['tv', 'movies-ovas', 'all'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setMediaFilter(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        mediaFilter === type
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {type === 'tv' ? 'TV Series' : type === 'movies-ovas' ? 'Movies & OVAs' : 'All Types'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Genre</label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500 text-sm"
                  >
                    {allGenres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'match' | 'score')}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500 text-sm"
                  >
                    <option value="match">Best Match</option>
                    <option value="score">MAL Score</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grid — overlaid card design */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {filteredAnime.map((anime) => (
            <div key={anime.node.id} className="relative group">
              <a
                href={`https://myanimelist.net/anime/${anime.node.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block rounded-xl overflow-hidden aspect-[3/4] border border-gray-800/60 hover:border-pink-500/50 transition-all"
              >
                {/* Cover image */}
                {anime.node.main_picture ? (
                  <img
                    src={anime.node.main_picture.large || anime.node.main_picture.medium}
                    alt={anime.node.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600">
                    <Tv className="w-10 h-10 sm:w-16 sm:h-16" />
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Score badge top left */}
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white text-xs font-bold">{anime.node.mean?.toFixed(1) || '?'}</span>
                </div>

                {/* Content overlay bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-semibold text-xs sm:text-sm line-clamp-2 mb-1.5">
                    {anime.node.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-300 mb-2">
                    {anime.node.num_episodes != null && anime.node.num_episodes > 0 && (
                      <span>{anime.node.num_episodes} eps</span>
                    )}
                    {anime.node.num_episodes != null && anime.node.num_episodes > 0 && anime.node.media_type && anime.node.media_type !== 'unknown' && (
                      <span className="text-gray-600">&#183;</span>
                    )}
                    {anime.node.media_type && anime.node.media_type !== 'unknown' && (
                      <span className="text-pink-400 font-medium uppercase">
                        {anime.node.media_type === 'ona' ? 'ONA' : anime.node.media_type.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Genre tags */}
                  <div className="flex flex-nowrap gap-1 overflow-x-auto scrollbar-none">
                    {anime.node.genres?.slice(0, 2).map(genre => (
                      <span
                        key={genre.id}
                        className="px-1.5 py-0.5 bg-white/10 backdrop-blur-sm text-gray-200 text-[10px] sm:text-[11px] rounded whitespace-nowrap flex-shrink-0"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              </a>

              {/* Info button top right */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltipId(activeTooltipId === anime.node.id ? null : anime.node.id);
                }}
                className="absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-gray-300 hover:text-white hover:border-pink-500/60 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Why recommended"
              >
                <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>

              {activeTooltipId === anime.node.id && anime.reason && (
                <RecommendationTooltip
                  reason={anime.reason}
                  animeTitle={anime.node.title}
                  onClose={() => setActiveTooltipId(null)}
                  isMobile={isMobile}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Want more recommendations? Try a different username or{' '}
            <Link to="/" className="text-pink-400 hover:text-pink-300">
              go back
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
