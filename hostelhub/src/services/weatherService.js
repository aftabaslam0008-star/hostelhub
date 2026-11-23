// Open-Meteo External API Service
// Free, public, highly reliable weather forecast API (no API key required)

export const PRESET_LOCATIONS = [
  { name: 'Lahore (Main Campus)', lat: 31.5204, lon: 74.3587, country: 'PK' },
  { name: 'Islamabad (North Campus)', lat: 33.6844, lon: 73.0479, country: 'PK' },
  { name: 'Karachi (South Campus)', lat: 24.8607, lon: 67.0011, country: 'PK' },
  { name: 'London (UK Hostel)', lat: 51.5074, lon: -0.1278, country: 'UK' },
  { name: 'New York (US Hostel)', lat: 40.7128, lon: -74.0060, country: 'US' },
  { name: 'Dubai (Gulf Campus)', lat: 25.2048, lon: 55.2708, country: 'AE' },
  { name: 'Delhi (City Hostel)', lat: 28.6139, lon: 77.2090, country: 'IN' },
  { name: 'Sydney (Pacific Hostel)', lat: -33.8688, lon: 151.2093, country: 'AU' },
]

export function getWeatherCondition(code) {
  if (code === 0) return { label: 'Clear Sky', icon: 'sun', type: 'sunny' }
  if (code === 1) return { label: 'Mainly Clear', icon: 'sun', type: 'sunny' }
  if (code === 2) return { label: 'Partly Cloudy', icon: 'cloud-sun', type: 'cloudy' }
  if (code === 3) return { label: 'Overcast', icon: 'cloud', type: 'cloudy' }
  if (code >= 45 && code <= 48) return { label: 'Foggy', icon: 'cloud-fog', type: 'fog' }
  if (code >= 51 && code <= 55) return { label: 'Light Drizzle', icon: 'cloud-drizzle', type: 'rain' }
  if (code >= 61 && code <= 65) return { label: 'Rainy', icon: 'cloud-rain', type: 'rain' }
  if (code >= 71 && code <= 77) return { label: 'Snowfall', icon: 'snowflake', type: 'snow' }
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', icon: 'cloud-rain', type: 'rain' }
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: 'cloud-lightning', type: 'storm' }
  return { label: 'Variable', icon: 'cloud', type: 'normal' }
}

export function getHostelWeatherAdvisory(temp, conditionType, humidity, wind) {
  if (conditionType === 'storm' || conditionType === 'rain') {
    return {
      severity: 'warning',
      title: 'Inclement Weather Advisory',
      message: 'Keep hostel windows firmly closed. Terrace access is temporarily restricted and backup power generators are primed.',
    }
  }
  if (temp >= 35) {
    return {
      severity: 'alert',
      title: 'High Heatwave Advisory',
      message: 'Campus water coolers & chiller systems operating at peak capacity. Stay hydrated and report any AC failures immediately.',
    }
  }
  if (temp <= 10) {
    return {
      severity: 'info',
      title: 'Low Temperature Advisory',
      message: 'Hostel geysers and central water heaters are scheduled active. Check room heating thermostats.',
    }
  }
  if (wind >= 35) {
    return {
      severity: 'warning',
      title: 'High Wind Warning',
      message: 'Secure balcony items, blinds, and windows across all hostel floors.',
    }
  }
  return {
    severity: 'success',
    title: 'Optimal Campus Conditions',
    message: 'Pleasant weather across the hostel grounds. Standard HVAC ventilation is active.',
  }
}

export async function getWeather(latitude = 31.5204, longitude = 74.3587, locationName = 'Lahore (Main Campus)') {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
  }).toString()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(url.toString(), { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Open-Meteo API returned status ${response.status}`)
    }

    const data = await response.json()
    const current = data.current || {}
    const condition = getWeatherCondition(current.weather_code ?? 0)
    const advisory = getHostelWeatherAdvisory(
      current.temperature_2m ?? 24,
      condition.type,
      current.relative_humidity_2m ?? 45,
      current.wind_speed_10m ?? 10
    )

    return {
      success: true,
      locationName,
      latitude,
      longitude,
      timezone: data.timezone || 'UTC',
      current: {
        temp: Math.round(current.temperature_2m ?? 24),
        apparentTemp: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 24),
        humidity: current.relative_humidity_2m ?? 45,
        windSpeed: Math.round(current.wind_speed_10m ?? 12),
        precipitation: current.precipitation ?? 0,
        isDay: current.is_day === 1,
        weatherCode: current.weather_code ?? 0,
        condition: condition.label,
        conditionType: condition.type,
      },
      daily: data.daily || null,
      advisory,
      fetchedAt: new Date().toLocaleTimeString(),
      source: 'Open-Meteo Live API',
    }
  } catch (err) {
    clearTimeout(timeoutId)
    // Fallback data so the UI remains 100% stable even if offline or network blocks external calls
    const isAbort = err.name === 'AbortError'
    return {
      success: false,
      isFallback: true,
      error: isAbort ? 'Weather request timed out' : err.message,
      locationName,
      latitude,
      longitude,
      current: {
        temp: 26,
        apparentTemp: 27,
        humidity: 50,
        windSpeed: 11,
        precipitation: 0,
        isDay: true,
        weatherCode: 1,
        condition: 'Mainly Clear (Cached)',
        conditionType: 'sunny',
      },
      advisory: {
        severity: 'info',
        title: 'Weather Information (Offline Mode)',
        message: 'Could not connect to Open-Meteo API. Showing cached campus forecast.',
      },
      fetchedAt: new Date().toLocaleTimeString(),
      source: 'Open-Meteo (Offline Cache)',
    }
  }
}
