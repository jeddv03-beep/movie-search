import { NextResponse } from "next/server";
import { watchmodeFetch } from "../../../lib/watchmode";

const MAX_RESULTS = 16;

function normalizeTitle(detail, fallback) {
  return {
    id: detail.id ?? fallback.id,
    title: detail.title || fallback.name,
    year: detail.year || fallback.year || null,
    rating: typeof detail.user_rating === "number" ? detail.user_rating : null,
    genres: Array.isArray(detail.genre_names) ? detail.genre_names : [],
    overview: detail.plot_overview || "",
    poster: detail.posterMedium || detail.poster || null,
    backdrop: detail.backdrop || null,
    type: detail.type || fallback.type || "movie",
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim();
  const genre = (searchParams.get("genre") || "").trim().toLowerCase();
  const year = Number(searchParams.get("year") || 0);
  const minRating = Number(searchParams.get("rating") || 0);
  const sort = searchParams.get("sort") || "relevance";
  const page = Math.max(1, Number(searchParams.get("page") || 1));

  if (!query) return NextResponse.json({ results: [], page: 1, hasMore: false });
  if (query.length > 120) {
    return NextResponse.json({ error: "Search query is too long." }, { status: 400 });
  }

  try {
    const data = await watchmodeFetch("/v1/search/", {
      search_field: "name",
      search_value: query,
      types: "movie",
    });

    const matches = Array.isArray(data.title_results)
      ? data.title_results.slice(0, MAX_RESULTS)
      : [];

    const details = await Promise.all(
      matches.map(async (match) => {
        try {
          const detail = await watchmodeFetch(
            "/v1/title/" + encodeURIComponent(match.id) + "/details/"
          );
          return normalizeTitle(detail, match);
        } catch {
          return normalizeTitle(match, match);
        }
      })
    );

    let results = details.filter(
      (movie) => movie.type === "movie" || movie.type === "tv_movie"
    );

    if (genre) {
      results = results.filter((movie) =>
        movie.genres.some((item) => item.toLowerCase() === genre)
      );
    }

    if (year) results = results.filter((movie) => movie.year === year);
    if (minRating) {
      results = results.filter(
        (movie) => typeof movie.rating === "number" && movie.rating >= minRating
      );
    }

    if (sort === "rating") {
      results.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    } else if (sort === "newest") {
      results.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    } else if (sort === "oldest") {
      results.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    }

    const pageSize = 8;
    const start = (page - 1) * pageSize;
    const paged = results.slice(start, start + pageSize);

    return NextResponse.json({
      results: paged,
      page,
      hasMore: start + pageSize < results.length,
      total: results.length,
      provider: "Watchmode",
    });
  } catch (error) {
    const status = error?.status || 500;
    const message =
      status === 401
        ? "The movie data service is not configured correctly."
        : status === 429
          ? "The movie data service is rate-limited. Please try again shortly."
          : "We couldn't load movie results right now.";

    return NextResponse.json({ error: message }, { status });
  }
}
