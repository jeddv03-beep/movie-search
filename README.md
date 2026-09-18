# CineFree

CineFree is a movie discovery and legal streaming-availability finder. It does not host, download, scrape, or redistribute movie files.

## Data

The application uses Watchmode for movie metadata and region-specific streaming availability. Watchmode supplies title metadata and links to provider destinations; it does not provide movie playback.

Set the server-side WATCHMODE_API_KEY environment variable in the deployment environment.

The free Watchmode developer plan currently provides a limited monthly API allowance and supports a limited number of countries. Availability and provider links can change.

## URL safety

Streaming links are accepted only when they are returned by the availability provider, use HTTPS, and pass basic destination validation. The application never constructs movie URLs from titles and never creates torrent, magnet, file-download, or DRM-bypass links.

## Features

- Movie title search
- Autocomplete
- Movie details
- Posters, ratings, genres, runtime and overview
- Cast and director information when supplied
- Region selector
- Free/ad-supported availability priority
- Subscription/rental/purchase availability
- Verified provider links opened in a new tab
- Local favorites/watchlist
- Genre/year/rating filters
- Sorting
- Responsive mobile/desktop UI
- Vercel-compatible Next.js application

## Attribution

Streaming availability is powered by Watchmode. See the Watchmode API documentation for current data, plan and attribution requirements.
