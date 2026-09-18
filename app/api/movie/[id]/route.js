import { NextResponse } from "next/server";
import { watchmodeFetch, isSafeProviderUrl } from "../../../../lib/watchmode";

const REGION_RE = /^[A-Z]{2}$/;

function labelForType(type) {
  if (type === "free") return "FREE WITH ADS";
  if (type === "sub") return "SUBSCRIPTION";
  if (type === "rent") return "RENT";
  if (type === "buy") return "BUY";
  if (type === "tve") return "TV PROVIDER";
  return "UNAVAILABLE";
}

function priority(type) {
  return ({ free: 0, sub: 1, rent: 2, buy: 3, tve: 4 })[type] ?? 9;
}

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const region = (searchParams.get("region") || "PH").toUpperCase();

  if (!/^\\d+$/.test(String(id))) {
    return NextResponse.json({ error: "Invalid movie id." }, { status: 400 });
  }

  if (!REGION_RE.test(region)) {
    return NextResponse.json({ error: "Invalid region." }, { status: 400 });
  }

  try {
    const detail = await watchmodeFetch(
      "/v1/title/" + encodeURIComponent(id) + "/details/",
      {
        append_to_response: "sources,cast-crew",
        regions: region,
        language: "en",
      }
    );

    const castCrew = Array.isArray(detail.cast) ? detail.cast : [];
    const cast = castCrew
      .filter((person) => person.type === "Cast")
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .slice(0, 12)
      .map((person) => ({ name: person.full_name, role: person.role || "" }));

    const directors = castCrew
      .filter((person) => person.type === "Crew" && /director/i.test(person.role || ""))
      .map((person) => person.full_name)
      .filter(Boolean);

    const sources = (Array.isArray(detail.sources) ? detail.sources : [])
      .filter((source) => source.region === region)
      .map((source) => {
        const url = typeof source.web_url === "string" ? source.web_url : null;
        const safeUrl = url && isSafeProviderUrl(url) ? url : null;

        return {
          id: source.source_id,
          name: source.name || "Streaming service",
          type: source.type,
          label: labelForType(source.type),
          region: source.region,
          url: safeUrl,
          price: source.price ?? null,
          format: source.format ?? null,
        };
      })
      .filter((source) => source.type === "free" || source.url)
      .sort((a, b) => priority(a.type) - priority(b.type));

    return NextResponse.json({
      movie: {
        id: detail.id,
        title: detail.title,
        year: detail.year,
        releaseDate: detail.release_date,
        runtime: detail.runtime_minutes,
        rating: detail.user_rating,
        criticScore: detail.critic_score,
        genres: detail.genre_names || [],
        overview: detail.plot_overview || "",
        poster: detail.posterLarge || detail.posterMedium || detail.poster || null,
        backdrop: detail.backdrop || null,
        trailer:
          typeof detail.trailer === "string" &&
          /^https:\\/\\/www\\.youtube\\.com\\//.test(detail.trailer)
            ? detail.trailer
            : null,
        cast,
        directors: [...new Set(directors)].slice(0, 3),
        sources,
        region,
        checkedAt: new Date().toISOString(),
      },
      attribution: "Streaming availability powered by Watchmode.",
    });
  } catch (error) {
    const status = error?.status || 500;
    const message =
      status === 404
        ? "That movie could not be found."
        : status === 401
          ? "The movie data service is not configured correctly."
          : status === 429
            ? "The movie data service is rate-limited. Please try again shortly."
            : "We couldn't load this movie right now.";

    return NextResponse.json({ error: message }, { status });
  }
}
