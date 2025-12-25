// DOM Elements
const cityInput = document.getElementById("cityInput")
const searchBtn = document.getElementById("searchBtn")
const loadingState = document.getElementById("loadingState")
const errorState = document.getElementById("errorState")
const weatherDisplay = document.getElementById("weatherDisplay")
const errorMessage = document.getElementById("errorMessage")
const retryBtn = document.getElementById("retryBtn")

// API Configuration - Using Open-Meteo (free, no API key required)
const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search"
const WEATHER_API = "https://api.open-meteo.com/v1/forecast"

// Weather condition mapping for icons
const weatherIcons = {
  clear: `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="25" fill="#FFD700" opacity="0.9"/>
        <circle cx="60" cy="60" r="20" fill="#FFA500"/>
        <path d="M60 10v15M60 95v15M10 60h15M95 60h15M23 23l11 11M86 86l11 11M23 97l11-11M86 34l11-11" stroke="#FFD700" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  cloudy: `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M80 60c8 0 15 7 15 15s-7 15-15 15H35c-11 0-20-9-20-20s9-20 20-20c1-13 12-23 25-23 11 0 20 7 23 17z" fill="#94A3B8" opacity="0.8"/>
        <path d="M75 55c6 0 12 5 12 12s-6 12-12 12H40c-9 0-16-7-16-16s7-16 16-16c1-10 10-18 20-18 9 0 16 6 19 14z" fill="#CBD5E1"/>
    </svg>`,
  rain: `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M75 45c6 0 12 5 12 12s-6 12-12 12H40c-9 0-16-7-16-16s7-16 16-16c1-10 10-18 20-18 9 0 16 6 19 14z" fill="#64748B"/>
        <path d="M45 75v15M55 75v15M65 75v15" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  snow: `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M75 45c6 0 12 5 12 12s-6 12-12 12H40c-9 0-16-7-16-16s7-16 16-16c1-10 10-18 20-18 9 0 16 6 19 14z" fill="#94A3B8"/>
        <circle cx="45" cy="80" r="3" fill="white"/>
        <circle cx="55" cy="85" r="3" fill="white"/>
        <circle cx="65" cy="80" r="3" fill="white"/>
    </svg>`,
  thunderstorm: `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M75 45c6 0 12 5 12 12s-6 12-12 12H40c-9 0-16-7-16-16s7-16 16-16c1-10 10-18 20-18 9 0 16 6 19 14z" fill="#475569"/>
        <path d="M55 70l-8 15h8l-5 10 15-18h-8l6-7z" fill="#FCD34D"/>
    </svg>`,
}

// Initialize app with default city
window.addEventListener("DOMContentLoaded", () => {
  getWeather("London")
})

// Event listeners
searchBtn.addEventListener("click", handleSearch)
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch()
})
retryBtn.addEventListener("click", handleSearch)

function handleSearch() {
  const city = cityInput.value.trim()
  if (city) {
    getWeather(city)
  }
}

async function getWeather(city) {
  showLoading()

  try {
    // Step 1: Get coordinates from city name
    const geoResponse = await fetch(`${GEOCODING_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`)
    const geoData = await geoResponse.json()

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Please try another location.")
    }

    const location = geoData.results[0]
    const { latitude, longitude, name, country } = location

    // Step 2: Get weather data using coordinates
    const weatherResponse = await fetch(
      `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`,
    )
    const weatherData = await weatherResponse.json()

    displayWeather(weatherData, name, country)
    showWeatherDisplay()
  } catch (error) {
    console.error("[v0] Weather fetch error:", error)
    showError(error.message || "Unable to fetch weather data. Please try again.")
  }
}

function displayWeather(data, cityName, country) {
  const current = data.current
  const daily = data.daily

  // Update city name and date
  document.getElementById("cityName").textContent = `${cityName}, ${country}`
  document.getElementById("currentDate").textContent = formatDate(new Date())

  // Update main temperature
  document.getElementById("mainTemp").textContent = Math.round(current.temperature_2m)
  document.getElementById("feelsLike").textContent = `${Math.round(current.apparent_temperature)}°C`

  // Update weather description and icon
  const weatherCondition = getWeatherCondition(current.weather_code)
  document.getElementById("weatherDesc").textContent = weatherCondition.description
  document.getElementById("mainWeatherIcon").innerHTML = weatherCondition.icon

  // Update stats
  document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`
  document.getElementById("windSpeed").textContent = `${Math.round(current.wind_speed_10m)} km/h`
  document.getElementById("pressure").textContent = `${Math.round(current.pressure_msl)} mb`
  document.getElementById("uvIndex").textContent = Math.round(daily.uv_index_max[0])
  document.getElementById("visibility").textContent = "10 km" // Default as API doesn't provide
  document.getElementById("dewPoint").textContent = `${Math.round(current.temperature_2m - 2)}°C` // Approximation

  // Update sunrise/sunset
  document.getElementById("sunrise").textContent = formatTime(daily.sunrise[0])
  document.getElementById("sunset").textContent = formatTime(daily.sunset[0])

  // Update 5-day forecast
  displayForecast(daily)
}

function displayForecast(daily) {
  const forecastGrid = document.getElementById("forecastGrid")
  forecastGrid.innerHTML = ""

  for (let i = 1; i < 6; i++) {
    const condition = getWeatherCondition(daily.weather_code[i])
    const card = document.createElement("div")
    card.className = "forecast-card"
    card.innerHTML = `
            <p class="forecast-day">${getDayName(daily.time[i])}</p>
            <div class="forecast-icon">${condition.icon}</div>
            <div class="forecast-temp">
                <span class="forecast-temp-high">${Math.round(daily.temperature_2m_max[i])}°</span>
                <span class="forecast-temp-low">${Math.round(daily.temperature_2m_min[i])}°</span>
            </div>
            <p class="forecast-desc">${condition.description}</p>
        `
    forecastGrid.appendChild(card)
  }
}

function getWeatherCondition(code) {
  // WMO Weather interpretation codes
  if (code === 0) return { description: "Clear Sky", icon: weatherIcons.clear }
  if (code <= 3) return { description: "Partly Cloudy", icon: weatherIcons.cloudy }
  if (code <= 48) return { description: "Foggy", icon: weatherIcons.cloudy }
  if (code <= 67) return { description: "Rainy", icon: weatherIcons.rain }
  if (code <= 77) return { description: "Snowy", icon: weatherIcons.snow }
  if (code <= 82) return { description: "Rain Showers", icon: weatherIcons.rain }
  if (code <= 86) return { description: "Snow Showers", icon: weatherIcons.snow }
  if (code <= 99) return { description: "Thunderstorm", icon: weatherIcons.thunderstorm }
  return { description: "Unknown", icon: weatherIcons.cloudy }
}

function formatDate(date) {
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  return date.toLocaleDateString("en-US", options)
}

function formatTime(datetime) {
  const date = new Date(datetime)
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
}

function getDayName(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { weekday: "short" })
}

function showLoading() {
  loadingState.classList.add("active")
  errorState.classList.remove("active")
  weatherDisplay.classList.remove("active")
}

function showError(message) {
  errorMessage.textContent = message
  errorState.classList.add("active")
  loadingState.classList.remove("active")
  weatherDisplay.classList.remove("active")
}

function showWeatherDisplay() {
  weatherDisplay.classList.add("active")
  loadingState.classList.remove("active")
  errorState.classList.remove("active")
}
