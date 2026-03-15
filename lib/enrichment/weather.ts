// Fetches live weather forecast from Open-Meteo API (free, no key)
// https://open-meteo.com/en/docs
// Returns null on any error — never throws

import { getAirportCoords } from '@/data/airport-coordinates'

export interface WeatherForecastDay {
  date: string
  highC: number
  lowC: number
  rain: number        // mm of precipitation
  description: string
}

export interface WeatherData {
  current: {
    tempC: number
    description: string
    icon: string
  }
  forecast: WeatherForecastDay[]
  packingTip: string
}

// WMO Weather Code → description + icon emoji
const WMO_CODES: Record<number, { desc: string; icon: string }> = {
  0:  { desc: 'Clear sky',           icon: '☀️' },
  1:  { desc: 'Mainly clear',        icon: '🌤️' },
  2:  { desc: 'Partly cloudy',       icon: '⛅' },
  3:  { desc: 'Overcast',            icon: '☁️' },
  45: { desc: 'Foggy',               icon: '🌫️' },
  48: { desc: 'Rime fog',            icon: '🌫️' },
  51: { desc: 'Light drizzle',       icon: '🌦️' },
  53: { desc: 'Moderate drizzle',    icon: '🌦️' },
  55: { desc: 'Dense drizzle',       icon: '🌧️' },
  56: { desc: 'Freezing drizzle',    icon: '🌧️' },
  57: { desc: 'Freezing drizzle',    icon: '🌧️' },
  61: { desc: 'Light rain',          icon: '🌦️' },
  63: { desc: 'Moderate rain',       icon: '🌧️' },
  65: { desc: 'Heavy rain',          icon: '🌧️' },
  66: { desc: 'Freezing rain',       icon: '🌧️' },
  67: { desc: 'Heavy freezing rain', icon: '🌧️' },
  71: { desc: 'Light snow',          icon: '🌨️' },
  73: { desc: 'Moderate snow',       icon: '🌨️' },
  75: { desc: 'Heavy snow',          icon: '❄️' },
  77: { desc: 'Snow grains',         icon: '❄️' },
  80: { desc: 'Light showers',       icon: '🌦️' },
  81: { desc: 'Moderate showers',    icon: '🌧️' },
  82: { desc: 'Heavy showers',       icon: '🌧️' },
  85: { desc: 'Light snow showers',  icon: '🌨️' },
  86: { desc: 'Heavy snow showers',  icon: '❄️' },
  95: { desc: 'Thunderstorm',        icon: '⛈️' },
  96: { desc: 'Thunderstorm + hail', icon: '⛈️' },
  99: { desc: 'Thunderstorm + hail', icon: '⛈️' },
}

function weatherFromCode(code: number): { desc: string; icon: string } {
  return WMO_CODES[code] ?? { desc: 'Unknown', icon: '🌡️' }
}

function generatePackingTip(forecast: WeatherForecastDay[], highAvg: number, lowAvg: number, totalRain: number): string {
  const tips: string[] = []

  if (totalRain > 30) {
    tips.push('Pack a rain jacket and waterproof shoes')
  } else if (totalRain > 10) {
    tips.push('Bring a compact umbrella')
  }

  if (highAvg > 32) {
    tips.push('light breathable clothing, sunscreen, and a hat')
  } else if (highAvg > 25) {
    tips.push('light layers and sunscreen')
  } else if (highAvg > 15) {
    tips.push('layers for variable weather')
  } else if (highAvg > 5) {
    tips.push('warm layers and a jacket')
  } else {
    tips.push('heavy winter clothing')
  }

  if (lowAvg < 10 && highAvg > 22) {
    tips.push('temperatures vary — pack layers')
  }

  const hasStorms = forecast.some(d =>
    d.description.toLowerCase().includes('thunderstorm')
  )
  if (hasStorms) {
    tips.push('thunderstorms expected — plan indoor alternatives')
  }

  return tips.join('. ') || 'Pack for comfortable conditions'
}

/**
 * Fetch live 10-day weather forecast from Open-Meteo.
 * Uses IATA code to look up lat/lon from the airport-coordinates data file.
 * Returns null if the airport is unknown or the API fails.
 */
export async function fetchWeather(
  iata: string,
  _departDate: string
): Promise<WeatherData | null> {
  const coords = getAirportCoords(iata)
  if (!coords) return null

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${coords.lat}&longitude=${coords.lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
    `&current=temperature_2m,weathercode` +
    `&timezone=auto&forecast_days=10`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null

    const data = await res.json() as OpenMeteoResponse

    if (!data.daily || !data.current) return null

    // Build forecast array
    const forecast: WeatherForecastDay[] = []
    const days = data.daily.time.length
    for (let i = 0; i < days; i++) {
      const code = data.daily.weathercode[i]
      const weather = weatherFromCode(code)
      forecast.push({
        date: data.daily.time[i],
        highC: Math.round(data.daily.temperature_2m_max[i]),
        lowC: Math.round(data.daily.temperature_2m_min[i]),
        rain: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
        description: weather.desc,
      })
    }

    // Current conditions
    const currentWeather = weatherFromCode(data.current.weathercode)

    // Averages for packing tip
    const highAvg = forecast.reduce((s, d) => s + d.highC, 0) / forecast.length
    const lowAvg = forecast.reduce((s, d) => s + d.lowC, 0) / forecast.length
    const totalRain = forecast.reduce((s, d) => s + d.rain, 0)

    return {
      current: {
        tempC: Math.round(data.current.temperature_2m),
        description: currentWeather.desc,
        icon: currentWeather.icon,
      },
      forecast,
      packingTip: generatePackingTip(forecast, highAvg, lowAvg, totalRain),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// Open-Meteo API response types (minimal)
interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    weathercode: number
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    weathercode: number[]
  }
}
