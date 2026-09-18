"use client";

import { useEffect, useMemo, useState } from "react";

const REGIONS = [
  ["PH", "Philippines"], ["US", "United States"], ["CA", "Canada"], ["GB", "United Kingdom"],
  ["AU", "Australia"], ["SG", "Singapore"], ["NZ", "New Zealand"], ["IE", "Ireland"],
  ["DE", "Germany"], ["FR", "France"], ["ES", "Spain"], ["IT", "Italy"],
];

const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Fantasy", "Horror", "Mystery", "Romance",
  "Science Fiction", "Thriller", "War", "Western",
];

function Poster({ src, alt, className = "" }) {
  return src ? (
    <img className={className} src={src} alt={alt} loading="lazy" />
  ) : (
    <div className={className + " poster-fallback"} aria-label={alt}>
      <span>NO POSTER</span>
    </div>
  );
}

function MovieCard({ movie, favorite, onFavorite }) {
  return (
    <article className="movie-card">
      <div className="poster-wrap">
        <Poster src={movie.poster} alt={movie.title + " poster"} className="poster" />
        {movie.rating !== null && <span className="rating-pill">★ {movie.rating.toFixed(1)}</span>}
        <button
          className={"favorite-button " + (favorite ? "active" : "")}
          onClick={() => onFavorite(movie)}
          aria-label={favorite ? "Remove " + movie.title + " from favorites" : "Add " + movie.title + " to favorites"}
          type="button"
        >
          {favorite ? "♥" : "♡"}
        </button>
      </div>
      <div className="card-body">
        <div className="eyebrow">
          {movie.year || "Year unknown"} · {movie.genres.slice(0, 2).join(" · ") || "Movie"}
        </div>
        <h2>{movie.title}</h2>
        <p>{movie.overview || "No overview is available for this title."}</p>
        <a className="button secondary full" href={"/movie/" + movie.id}>View Details</a>
      </div>
    </article>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("PH");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [rating, setRating] = useState("");
  const [sort, setSort] = useState("relevance");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      const savedRegion = localStorage.getItem("cinefree-region");
      const savedFavorites = JSON.parse(localStorage.getItem("cinefree-favorites") || "[]");
      if (savedRegion) setRegion(savedRegion);
      if (Array.isArray(savedFavorites)) setFavorites(savedFavorites);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("cinefree-region", region); } catch {}
  }, [region]);

  useEffect(() => {
    try { localStorage.setItem("cinefree-favorites", JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  useEffect(() => {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2 || searched) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/autocomplete?q=" + encodeURIComponent(cleanQuery));
        const data = await response.json();
        setSuggestions(data.results || []);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searched]);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((item) => item.id)),
    [favorites]
  );

  function toggleFavorite(movie) {
    setFavorites((current) =>
      current.some((item) => item.id === movie.id)
        ? current.filter((item) => item.id !== movie.id)
        : [...current, movie]
    );
  }

  async function searchMovies(nextPage = 1) {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setLoading(true);
    setError("");
    setSuggestions([]);

    const params = new URLSearchParams({
      q: cleanQuery,
      page: String(nextPage),
      sort,
    });

    if (genre) params.set("genre", genre);
    if (year) params.set("year", year);
    if (rating) params.set("rating", rating);

    try {
      const response = await fetch("/api/search?" + params.toString());
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Search failed.");

      setResults((current) =>
        nextPage === 1 ? data.results || [] : [...current, ...(data.results || [])]
      );
      setPage(nextPage);
      setHasMore(Boolean(data.hasMore));
      setSearched(true);
    } catch (err) {
      setResults([]);
      setHasMore(false);
      setError(err.message || "Search failed.");
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    searchMovies(1);
  }

  function chooseSuggestion(item) {
    setQuery(item.title);
    setSuggestions([]);
    setSearched(false);
    setTimeout(() => searchMovies(1), 0);
  }

  function clearFilters() {
    setGenre("");
    setYear("");
    setRating("");
    setSort("relevance");
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/">Cine<span>Free</span></a>
        <nav>
          <a href="#favorites">Favorites</a>
          <a href="#how-it-works">How it works</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="badge">LEGAL STREAMING DISCOVERY</div>
          <h1>Find where movies<br /><em>are free to watch.</em></h1>
          <p>
            Search movies and discover verified streaming availability for your region.
            CineFree never hosts or distributes movie files.
          </p>

          <form className="search-shell" onSubmit={submitSearch}>
            <div className="search-row">
              <span className="search-icon">⌕</span>
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearched(false);
                }}
                onFocus={() => setSearched(false)}
                placeholder="Search for a movie..."
                aria-label="Search for a movie"
                autoComplete="off"
              />
              <button className="button primary" type="submit" disabled={loading || !query.trim()}>
                {loading ? "Searching…" : "Search"}
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map((item) => (
                  <button key={item.id} type="button" onClick={() => chooseSuggestion(item)}>
                    {item.image && <img src={item.image} alt="" />}
                    <span>{item.title}</span>
                    <small>{item.year || ""}</small>
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="region-row">
            <label htmlFor="region">Region</label>
            <select id="region" value={region} onChange={(event) => setRegion(event.target.value)}>
              {REGIONS.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
            <span>Availability is checked for the selected country.</span>
          </div>
        </div>
      </section>

      <section className="content-section" id="results">
        <div className="section-heading">
          <div>
            <span className="section-kicker">DISCOVER</span>
            <h2>{searched ? "Results for “" + query.trim() + "”" : "Search the catalog"}</h2>
          </div>
          {results.length > 0 && <span className="result-count">{results.length} shown</span>}
        </div>

        <div className="filters">
          <select aria-label="Genre filter" value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">All genres</option>
            {GENRES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <input
            aria-label="Release year filter"
            type="number"
            min="1888"
            max={new Date().getFullYear() + 2}
            placeholder="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />

          <select aria-label="Minimum rating filter" value={rating} onChange={(e) => setRating(e.target.value)}>
            <option value="">Any rating</option>
            <option value="9">9+</option>
            <option value="8">8+</option>
            <option value="7">7+</option>
            <option value="6">6+</option>
            <option value="5">5+</option>
          </select>

          <select aria-label="Sort movies" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="relevance">Relevance</option>
            <option value="rating">Rating</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>

          <button type="button" className="button ghost" onClick={clearFilters}>Clear filters</button>
          {searched && (
            <button type="button" className="button primary compact" onClick={() => searchMovies(1)}>
              Apply
            </button>
          )}
        </div>

        {loading && results.length === 0 && (
          <div className="state-card">
            <div className="spinner" />
            <strong>Searching the movie catalog…</strong>
            <span>Finding matching titles and metadata.</span>
          </div>
        )}

        {!loading && error && (
          <div className="state-card error-state">
            <strong>Something went wrong</strong>
            <span>{error}</span>
            <button className="button secondary" type="button" onClick={() => searchMovies(1)}>Try again</button>
          </div>
        )}

        {!loading && !error && searched && results.length === 0 && (
          <div className="state-card">
            <strong>No matching movies found.</strong>
            <span>Try a different title or clear one of the filters.</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="movie-grid">
            {results.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                favorite={favoriteIds.has(movie.id)}
                onFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="load-more">
            <button
              className="button secondary"
              type="button"
              disabled={loading}
              onClick={() => searchMovies(page + 1)}
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </section>

      <section className="content-section favorites-section" id="favorites">
        <div className="section-heading">
          <div>
            <span className="section-kicker">YOUR LIST</span>
            <h2>Favorites</h2>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="empty-favorites">
            <span className="heart-large">♡</span>
            <div>
              <strong>Your watchlist is empty.</strong>
              <p>Save movies from search results and they will stay in this browser.</p>
            </div>
          </div>
        ) : (
          <div className="movie-grid">
            {favorites.map((movie) => (
              <MovieCard key={movie.id} movie={movie} favorite onFavorite={toggleFavorite} />
            ))}
          </div>
        )}
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-heading">
          <div>
            <span className="section-kicker">HOW IT WORKS</span>
            <h2>Discovery, not piracy.</h2>
          </div>
        </div>
        <div className="steps">
          <div><b>01</b><strong>Search</strong><p>Find a movie using verified catalog metadata.</p></div>
          <div><b>02</b><strong>Check</strong><p>Availability is filtered to your selected region.</p></div>
          <div><b>03</b><strong>Watch legally</strong><p>Open the verified provider page. CineFree never hosts the movie.</p></div>
        </div>
      </section>

      <footer>
        <div><span className="brand">Cine<span>Free</span></span><p>Legal movie discovery and streaming availability.</p></div>
        <p>Streaming availability powered by Watchmode. Availability can change.</p>
      </footer>
    </main>
  );
}
