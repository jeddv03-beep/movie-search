"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const REGIONS = [
  ["PH", "Philippines"], ["US", "United States"], ["CA", "Canada"], ["GB", "United Kingdom"],
  ["AU", "Australia"], ["SG", "Singapore"], ["NZ", "New Zealand"], ["IE", "Ireland"],
  ["DE", "Germany"], ["FR", "France"], ["ES", "Spain"], ["IT", "Italy"],
];

function Poster({ src, alt }) {
  return src
    ? <img className="detail-poster" src={src} alt={alt} />
    : <div className="detail-poster poster-fallback"><span>NO POSTER</span></div>;
}

function sourceClass(type) {
  return type === "free" ? "source-free" : "source-standard";
}

export default function MovieDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [region, setRegion] = useState("PH");
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    try {
      const savedRegion = localStorage.getItem("cinefree-region");
      if (savedRegion) setRegion(savedRegion);
    } catch {}
  }, []);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          "/api/movie/" + encodeURIComponent(id) + "?region=" + region
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load movie.");
        if (!cancelled) setMovie(data.movie);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load movie.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, region]);

  useEffect(() => {
    if (!movie) return;
    try {
      const saved = JSON.parse(localStorage.getItem("cinefree-favorites") || "[]");
      setFavorite(saved.some((item) => item.id === movie.id));
    } catch {}
  }, [movie]);

  function toggleFavorite() {
    if (!movie) return;
    try {
      const saved = JSON.parse(localStorage.getItem("cinefree-favorites") || "[]");
      const exists = saved.some((item) => item.id === movie.id);
      const next = exists
        ? saved.filter((item) => item.id !== movie.id)
        : [...saved, movie];
      localStorage.setItem("cinefree-favorites", JSON.stringify(next));
      setFavorite(!exists);
    } catch {}
  }

  const freeSources = useMemo(
    () => (movie?.sources || []).filter((source) => source.type === "free"),
    [movie]
  );

  const otherSources = useMemo(
    () => (movie?.sources || []).filter((source) => source.type !== "free"),
    [movie]
  );

  if (loading) {
    return (
      <main className="details-page">
        <div className="state-card page-state">
          <div className="spinner" />
          <strong>Loading movie details…</strong>
          <span>Checking verified availability.</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="details-page">
        <div className="state-card error-state page-state">
          <strong>Could not load this movie</strong>
          <span>{error}</span>
          <a className="button secondary" href="/">Back to search</a>
        </div>
      </main>
    );
  }

  if (!movie) return null;

  const runtime = movie.runtime
    ? Math.floor(movie.runtime / 60) + "h " + (movie.runtime % 60) + "m"
    : null;

  return (
    <main className="details-page">
      <div
        className="backdrop"
        style={
          movie.backdrop
            ? {
                backgroundImage:
                  'linear-gradient(90deg, rgba(7,8,13,.98) 0%, rgba(7,8,13,.9) 42%, rgba(7,8,13,.5) 100%), url("' +
                  movie.backdrop +
                  '")',
              }
            : undefined
        }
      />

      <header className="site-header detail-header">
        <a className="brand" href="/">Cine<span>Free</span></a>
        <a className="back-link" href="/">← Back to search</a>
      </header>

      <section className="detail-hero">
        <Poster src={movie.poster} alt={movie.title + " poster"} />
        <div className="detail-info">
          <div className="badge">MOVIE DETAILS</div>
          <h1>{movie.title}</h1>

          <div className="meta-line">
            {movie.year && <span>{movie.year}</span>}
            {movie.genres?.length > 0 && <span>{movie.genres.slice(0, 4).join(" · ")}</span>}
            {runtime && <span>{runtime}</span>}
            {movie.rating !== null && <span>★ {movie.rating.toFixed(1)}</span>}
          </div>

          <p className="overview">
            {movie.overview || "No overview is available for this title."}
          </p>

          <div className="detail-actions">
            <button
              className={"button " + (favorite ? "primary" : "secondary")}
              type="button"
              onClick={toggleFavorite}
            >
              {favorite ? "♥ In Favorites" : "♡ Add to Favorites"}
            </button>

            {movie.trailer && (
              <a
                className="button ghost"
                href={movie.trailer}
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch Trailer
              </a>
            )}
          </div>

          <div className="people-grid">
            {movie.directors?.length > 0 && (
              <div>
                <span>DIRECTOR</span>
                <strong>{movie.directors.join(", ")}</strong>
              </div>
            )}
            {movie.cast?.length > 0 && (
              <div>
                <span>CAST</span>
                <strong>
                  {movie.cast.slice(0, 5).map((person) => person.name).join(", ")}
                </strong>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="availability-section">
        <div className="availability-heading">
          <div>
            <span className="section-kicker">WHERE TO WATCH</span>
            <h2>Legal streaming availability</h2>
            <p>Showing verified sources for the selected region.</p>
          </div>

          <label className="region-picker">
            <span>Region</span>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                localStorage.setItem("cinefree-region", e.target.value);
              }}
            >
              {REGIONS.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </label>
        </div>

        {freeSources.length > 0 ? (
          <div className="free-banner">
            <span>FREE OPTIONS FOUND</span>
            <strong>
              {freeSources.length} legal free {freeSources.length === 1 ? "option" : "options"} in {region}
            </strong>
          </div>
        ) : (
          <div className="no-free">
            <strong>
              No verified free streaming option is currently available in your region.
            </strong>
            <span>Paid or subscription availability may still be listed below.</span>
          </div>
        )}

        <div className="sources-list">
          {[...freeSources, ...otherSources].map((source) => (
            <article
              className={"source-card " + sourceClass(source.type)}
              key={source.id + "-" + source.type + "-" + source.region}
            >
              <div className="provider-mark">{source.name.slice(0, 2).toUpperCase()}</div>

              <div className="source-main">
                <div className="source-topline">
                  <span className="source-label">{source.label}</span>
                  <span className="source-region">{source.region}</span>
                </div>
                <h3>{source.name}</h3>
                <p>
                  {source.type === "free"
                    ? "Free with ads"
                    : source.type === "sub"
                      ? "Requires a subscription"
                      : source.type === "rent"
                        ? "Available to rent"
                        : source.type === "buy"
                          ? "Available to purchase"
                          : "TV provider access"}
                  {source.format ? " · " + source.format : ""}
                </p>
              </div>

              {source.url ? (
                <a
                  className={"button " + (source.type === "free" ? "primary" : "secondary")}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.type === "free" ? "Watch Free" : "View Service"}
                </a>
              ) : (
                <span className="link-unavailable">Provider link unavailable</span>
              )}
            </article>
          ))}
        </div>

        {movie.sources.length === 0 && (
          <div className="state-card compact-state">
            <strong>No streaming availability was returned for this region.</strong>
            <span>Try another region or check again later.</span>
          </div>
        )}

        <p className="checked-note">
          Availability checked {new Date(movie.checkedAt).toLocaleString()} · {movie.sources.length} verified source{movie.sources.length === 1 ? "" : "s"} returned.
        </p>
      </section>

      <footer>
        <div>
          <span className="brand">Cine<span>Free</span></span>
          <p>Legal movie discovery and streaming availability.</p>
        </div>
        <p>Streaming availability powered by Watchmode. Availability can change.</p>
      </footer>
    </main>
  );
}
