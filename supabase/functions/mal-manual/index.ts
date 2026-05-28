import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAL_CLIENT_ID = Deno.env.get('MAL_CLIENT_ID');
const MAL_API_BASE = 'https://api.myanimelist.net/v2';

const JUNK_TITLE_PATTERNS = [
  /picture drama/i,
  /recap/i,
  /recaps/i,
  /re-?cap/i,
  /summary/i,
  /compilation/i,
  /special: /i,
  /: special$/i,
  /\(recap\)/i,
  /\(summary\)/i,
];

type MediaType = 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music' | 'unknown';

interface RelatedAnime {
  node: { id: number; title: string };
  relation_type: string;
}

interface RecommendationReason {
  matchedGenres: string[];
  basedOn: string[];
  malScore: number;
}

interface AnimeEntry {
  node: {
    id: number;
    title: string;
    main_picture?: { medium: string; large: string };
    genres?: Array<{ id: number; name: string }>;
    studios?: Array<{ id: number; name: string }>;
    mean?: number;
    num_episodes?: number;
    media_type?: MediaType;
    related_anime?: RelatedAnime[];
    start_date?: string;
  };
  list_status?: {
    score: number;
    status: string;
  };
  matchScore?: number;
  genreScore?: number;
  reason?: RecommendationReason;
}

interface MALResponse {
  data: AnimeEntry[];
  paging?: { next?: string };
}

function isJunk(entry: AnimeEntry): boolean {
  const title = entry.node.title;
  const episodes = entry.node.num_episodes ?? 0;
  const mediaType = entry.node.media_type;

  if (JUNK_TITLE_PATTERNS.some(p => p.test(title))) return true;
  if (mediaType === 'music') return true;
  if (mediaType !== 'movie' && episodes > 0 && episodes < 4) return true;

  return false;
}

function meetsScoreThreshold(entry: AnimeEntry): boolean {
  const score = entry.node.mean ?? 0;
  const mediaType = entry.node.media_type;

  if (mediaType === 'movie') return score >= 8.0;
  return score >= 7.5;
}

async function fetchMALAPI(endpoint: string, clientId: string): Promise<MALResponse> {
  const url = endpoint.startsWith('http') ? endpoint : `${MAL_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'X-MAL-CLIENT-ID': clientId }
  });

  if (!response.ok) {
    throw new Error(`MAL API error: ${response.status}`);
  }

  return response.json();
}

function extractTopGenres(animeList: AnimeEntry[]): string[] {
  const genreCount: Record<string, number> = {};

  animeList
    .filter(entry => (entry.list_status?.score ?? 0) >= 7)
    .forEach(entry => {
      entry.node.genres?.forEach(genre => {
        genreCount[genre.name] = (genreCount[genre.name] || 0) + 1;
      });
    });

  return Object.entries(genreCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre);
}

function buildTasteProfile(animeList: AnimeEntry[]): Map<string, number> {
  const genreFrequency = new Map<string, number>();

  animeList.forEach(entry => {
    const score = entry.list_status?.score || 0;
    const status = entry.list_status?.status || '';

    if (score >= 8 || status === 'watching') {
      entry.node.genres?.forEach(genre => {
        const count = genreFrequency.get(genre.name) || 0;
        genreFrequency.set(genre.name, count + 1);
      });
    }
  });

  return genreFrequency;
}

async function fetchRecommendations(
  tasteProfile: Map<string, number>,
  watchedList: AnimeEntry[],
  clientId: string
): Promise<AnimeEntry[]> {
  const sortedGenres = Array.from(tasteProfile.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  if (sortedGenres.length === 0) {
    sortedGenres.push('Action', 'Adventure', 'Drama', 'Fantasy', 'Comedy');
  }

  const genreToUserAnime = new Map<string, string[]>();
  watchedList.forEach(entry => {
    const score = entry.list_status?.score || 0;
    const status = entry.list_status?.status || '';
    if (score >= 8 || status === 'watching') {
      entry.node.genres?.forEach(g => {
        const titles = genreToUserAnime.get(g.name) ?? [];
        if (!titles.includes(entry.node.title)) titles.push(entry.node.title);
        genreToUserAnime.set(g.name, titles);
      });
    }
  });

  const watchedIds = new Set(watchedList.map(entry => entry.node.id));
  const candidates = new Map<number, AnimeEntry>();

  const addCandidates = (data: MALResponse) => {
    data.data.forEach(entry => {
      if (watchedIds.has(entry.node.id) || candidates.has(entry.node.id)) return;
      if (!meetsScoreThreshold(entry)) return;
      if (isJunk(entry)) return;
      candidates.set(entry.node.id, entry);
    });
  };

  const addRecentCandidates = (data: MALResponse) => {
    data.data.forEach(entry => {
      if (watchedIds.has(entry.node.id) || candidates.has(entry.node.id)) return;
      const year = entry.node.start_date ? parseInt(entry.node.start_date.split('-')[0]) : 0;
      if (year < 2018) return;
      if (!meetsScoreThreshold(entry)) return;
      if (isJunk(entry)) return;
      candidates.set(entry.node.id, entry);
    });
  };

  const fields = 'genres,mean,num_episodes,main_picture,media_type,related_anime,start_date,studios';

  // SOURCE 1: Genre-based search results
  for (const genre of sortedGenres) {
    try {
      const data = await fetchMALAPI(
        `/anime?fields=${fields}&limit=50&q=${encodeURIComponent(genre)}`,
        clientId
      );
      addCandidates(data);
    } catch (e) {
      console.error(`Error searching genre ${genre}:`, e);
    }
  }

  // SOURCE 2: Recent anime from popularity ranking
  try {
    const data = await fetchMALAPI(
      `/anime/ranking?ranking_type=bypopularity&limit=100&fields=${fields}`,
      clientId
    );
    addRecentCandidates(data);
  } catch (e) {
    console.error('Error fetching recent popular anime:', e);
  }

  try {
    const data = await fetchMALAPI(
      `/anime/ranking?ranking_type=all&limit=100&fields=${fields}`,
      clientId
    );
    addRecentCandidates(data);
  } catch (e) {
    console.error('Error fetching recent top anime:', e);
  }

  for (const genre of sortedGenres.slice(0, 3)) {
    try {
      const data = await fetchMALAPI(
        `/anime?fields=${fields}&limit=50&q=${encodeURIComponent(genre + ' 2023')}`,
        clientId
      );
      addRecentCandidates(data);
    } catch (e) {
      console.error(`Error searching recent genre ${genre}:`, e);
    }
    try {
      const data = await fetchMALAPI(
        `/anime?fields=${fields}&limit=50&q=${encodeURIComponent(genre + ' 2024')}`,
        clientId
      );
      addRecentCandidates(data);
    } catch (e) {
      console.error(`Error searching recent genre ${genre} 2024:`, e);
    }
  }

  // SOURCE 3: Seasonal rankings
  const seasons = ['winter', 'spring', 'summer', 'fall'];
  const recentYears = [2025, 2024, 2023, 2022, 2021, 2020];
  for (const year of recentYears) {
    for (const season of seasons) {
      if (year === 2025 && (season === 'summer' || season === 'fall')) continue;
      try {
        const data = await fetchMALAPI(
          `/anime/season/${year}/${season}?fields=${fields}&limit=25&sort=anime_score`,
          clientId
        );
        addCandidates(data);
      } catch (e) {
        console.error(`Error fetching ${season} ${year}:`, e);
      }
    }
  }

  // Build genre weights
  const genreWeights: Record<string, number> = {};
  watchedList.forEach(entry => {
    const score = entry.list_status?.score || 0;
    if (score >= 8) {
      entry.node.genres?.forEach(g => {
        genreWeights[g.name] = (genreWeights[g.name] || 0) + score;
      });
    }
  });

  // Build studio weights
  const studioWeights: Record<string, number> = {};
  watchedList.forEach(entry => {
    const score = entry.list_status?.score || 0;
    if (score >= 8) {
      entry.node.studios?.forEach(studio => {
        studioWeights[studio.name] = (studioWeights[studio.name] || 0) + 1;
      });
    }
  });

  // Score candidates
  const scored = Array.from(candidates.values()).map(entry => {
    let personalScore = 0;
    const matchedGenres: string[] = [];
    const basedOnSet = new Set<string>();

    entry.node.genres?.forEach(g => {
      if (genreWeights[g.name]) {
        personalScore += genreWeights[g.name] * 0.5;
        matchedGenres.push(g.name);
        const influencers = genreToUserAnime.get(g.name) ?? [];
        influencers.slice(0, 3).forEach(t => basedOnSet.add(t));
      }
    });

    entry.node.studios?.forEach(studio => {
      if (studioWeights[studio.name]) {
        personalScore += studioWeights[studio.name] * 10 * 0.2;
      }
    });

    const malScore = entry.node.mean || 0;
    personalScore += malScore * 0.3;

    const reason: RecommendationReason = {
      matchedGenres,
      basedOn: Array.from(basedOnSet).slice(0, 3),
      malScore,
    };

    return { ...entry, matchScore: personalScore, genreScore: personalScore, reason };
  });

  scored.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const deduped = deduplicateFranchises(scored);

  const post2015 = deduped.filter(anime => {
    const year = anime.node.start_date ? parseInt(anime.node.start_date.split('-')[0]) : 0;
    return year >= 2015;
  });

  const pre2015 = deduped.filter(anime => {
    const year = anime.node.start_date ? parseInt(anime.node.start_date.split('-')[0]) : 0;
    return year < 2015;
  });

  const newerCount = Math.ceil(20 * 0.65);
  const classicCount = Math.floor(20 * 0.35);

  return [
    ...post2015.slice(0, newerCount),
    ...pre2015.slice(0, classicCount),
  ];
}

function firstTwoWords(title: string): string {
  return title.toLowerCase().split(/\s+/).slice(0, 2).join(' ');
}

function deduplicateFranchises(entries: AnimeEntry[]): AnimeEntry[] {
  const idSet = new Set(entries.map(e => e.node.id));
  const toRemove = new Set<number>();

  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of entries) {
      if (toRemove.has(entry.node.id)) continue;
      const related = entry.node.related_anime ?? [];
      for (const rel of related) {
        const relType = rel.relation_type.toLowerCase();
        const relInResults = idSet.has(rel.node.id) && !toRemove.has(rel.node.id);
        if (relType === 'prequel' && relInResults) {
          toRemove.add(entry.node.id);
          changed = true;
          break;
        }
        if (
          (relType === 'sequel' || relType === 'alternative_version' ||
           relType === 'side_story' || relType === 'spin_off') &&
          relInResults && rel.node.id < entry.node.id
        ) {
          toRemove.add(entry.node.id);
          changed = true;
          break;
        }
      }
    }
  }

  const remaining = [...entries]
    .filter(e => !toRemove.has(e.node.id))
    .sort((a, b) => a.node.id - b.node.id);

  const seen = new Map<string, number>();
  for (const entry of remaining) {
    const key = firstTwoWords(entry.node.title);
    if (!seen.has(key)) {
      seen.set(key, entry.node.id);
    } else {
      toRemove.add(entry.node.id);
    }
  }

  return entries.filter(e => !toRemove.has(e.node.id));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!MAL_CLIENT_ID) {
      return new Response(JSON.stringify({ error: 'MAL Client ID not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { animeList } = await req.json();

    if (!animeList || !Array.isArray(animeList) || animeList.length < 10) {
      return new Response(JSON.stringify({ error: 'At least 10 anime required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userList: AnimeEntry[] = animeList;

    const tasteProfile = buildTasteProfile(userList);
    const recommendations = await fetchRecommendations(tasteProfile, userList, MAL_CLIENT_ID);

    const scoredEntries = userList.filter(e => (e.list_status?.score ?? 0) > 0);
    const totalWatched = userList.length;
    const averageScore = scoredEntries.length > 0
      ? scoredEntries.reduce((sum, e) => sum + (e.list_status?.score ?? 0), 0) / scoredEntries.length
      : 0;

    const topGenres = extractTopGenres(userList);
    const tasteProfileObj = Object.fromEntries(tasteProfile);
    const watchedIds = userList.map(e => e.node.id);

    return new Response(JSON.stringify({
      recommendations,
      tasteProfile: tasteProfileObj,
      topGenres,
      totalWatched,
      averageScore,
      watchedIds
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Manual recommendation error:', error);
    return new Response(JSON.stringify({ error: 'api_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
