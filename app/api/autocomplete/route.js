import { NextResponse } from "next/server";
import { watchmodeFetch } from "../../../lib/watchmode";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim();

  if (query.length < 2) return NextResponse.json({ results: [] });

  try {
    const data = await watchmodeFetch("/v1/autocomplete-search/", {
      search_value: query.slice(0, 80),
      search_type: "3",
    });

    const results = (Array.isArray(data.results) ? data.results : [])
      .filter((item) => item.result_type === "title" && item.type === "movie")
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        title: item.name,
        year: item.year ?? null,
        image: item.image_url ?? null,
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
