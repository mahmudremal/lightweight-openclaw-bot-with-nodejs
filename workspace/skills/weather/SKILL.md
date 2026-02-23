---
name: weather
description: Get current weather and forecasts.
homepage: https://wttr.in/:help
metadata:
  emoji: "🌤️"
---

# Weather

Use the `request` tool to fetch weather information.

## wttr.in (primary)

To get current weather:

- **Url**: `https://wttr.in/London?format=3`

Compact format:

- **Url**: `https://wttr.in/London?format=%l:+%c+%t+%h+%w`

Full forecast:

- **Url**: `https://wttr.in/London?T`

Tips:

- URL-encode spaces: `wttr.in/New+York`
- Airport codes: `wttr.in/JFK`
- Units: `?m` (metric) `?u` (USCS)
- Today only: `?1` · Current only: `?0`

## Open-Meteo (fallback, JSON)

Free, no key, good for programmatic use:

- **Url**: `https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.12&current_weather=true`

Find coordinates for a city, then query. Returns JSON.
