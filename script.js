// =============================================
//   Megha Mathew's Weather App — JavaScript
// =============================================

// ----  OpenWeatherMap API Key ----
const API_KEY = '03c1734bf5c4784d8d2aecec722237e6';

// ---- Store temperatures so we can toggle C/F ----
let tempC         = null;
let feelsLikeC    = null;
let forecastStore = [];

// ---- Allow pressing Enter to search ----
document.getElementById('cityInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') searchWeather();
});


// =============================================
//   SEARCH BY CITY NAME
// =============================================
function searchWeather() {
  const city = document.getElementById('cityInput').value.trim();

  // Make sure user typed something
  if (!city) {
    showError('Please enter a city name.');
    return;
  }

  fetchWeatherByCity(city);
}


// =============================================
//   USE GPS LOCATION
// =============================================
function getMyLocation() {
  // Check if browser supports geolocation
  if (!navigator.geolocation) {
    showError('Your browser does not support location access.');
    return;
  }

  showLoader();

  // Ask browser for coordinates
  navigator.geolocation.getCurrentPosition(
    function(position) {
      // Success — got coordinates
      fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
    },
    function() {
      // Failed — user denied or error
      hideLoader();
      showError('Could not get your location. Please allow location access and try again.');
    }
  );
}


// =============================================
//   STEP 1: CONVERT CITY NAME TO COORDINATES
// =============================================
async function fetchWeatherByCity(city) {
  showLoader();
  hideError();

  try {
    // Use OpenWeatherMap's Geocoding API to turn city name into lat/lon
    const geoURL      = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
    const geoResponse = await fetch(geoURL);
    const geoData     = await geoResponse.json();

    // If no results, city doesn't exist
    if (!geoData.length) {
      hideLoader();
      showError(`City "${city}" not found. Please try a different name.`);
      return;
    }

    // Now fetch weather using the coordinates
    fetchWeatherByCoords(geoData[0].lat, geoData[0].lon);

  } catch (error) {
    hideLoader();
    showError('Something went wrong. Please check your internet connection.');
  }
}


// =============================================
//   STEP 2: FETCH WEATHER USING COORDINATES
// =============================================
async function fetchWeatherByCoords(lat, lon) {
  showLoader();
  hideError();

  try {
    // Fetch current weather AND 5-day forecast at the same time
    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
    ]);

    // Handle API key errors
    if (!weatherResponse.ok) {
      hideLoader();
      if (weatherResponse.status === 401) {
        showError('Invalid API key. Please update the API_KEY in script.js.');
      } else {
        showError('Could not fetch weather data. Please try again.');
      }
      return;
    }

    // Convert responses to JSON
    const weatherData  = await weatherResponse.json();
    const forecastData = await forecastResponse.json();

    // Display everything on screen
    displayCurrentWeather(weatherData);
    displayForecast(forecastData.list);

    hideLoader();

  } catch (error) {
    hideLoader();
    showError('Network error. Please check your internet connection.');
  }
}


// =============================================
//   DISPLAY CURRENT WEATHER ON SCREEN
// =============================================
function displayCurrentWeather(data) {
  // Save temps for C/F toggling later
  tempC      = Math.round(data.main.temp);
  feelsLikeC = Math.round(data.main.feels_like);

  // City name and country
  document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;

  // Weather description e.g. "light rain"
  document.getElementById('weatherDesc').textContent = data.weather[0].description;

  // Weather icon from OpenWeatherMap
  document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  // Temperature (start with Celsius)
  document.getElementById('temperature').textContent = `${tempC}°C`;
  document.getElementById('feelsLike').textContent   = `Feels like ${feelsLikeC}°C`;

  // Reset the toggle buttons to Celsius
  document.getElementById('btnC').classList.add('active');
  document.getElementById('btnF').classList.remove('active');

  // Stats
  document.getElementById('humidity').textContent   = `${data.main.humidity}%`;
  document.getElementById('windSpeed').textContent  = `${Math.round(data.wind.speed * 3.6)} km/h`;
  document.getElementById('pressure').textContent   = `${data.main.pressure} hPa`;
  document.getElementById('visibility').textContent = data.visibility
    ? `${(data.visibility / 1000).toFixed(1)} km`
    : 'N/A';

  // Sunrise and sunset (convert Unix timestamp to readable time)
  document.getElementById('sunrise').textContent = formatTime(data.sys.sunrise * 1000);
  document.getElementById('sunset').textContent  = formatTime(data.sys.sunset  * 1000);

  // Change background color to match weather
  applyTheme(data.weather[0].id, data.weather[0].icon);

  // Show smart tips
  showSmartTips(data);

  // Make the card visible
  document.getElementById('weatherCard').style.display = 'block';
}


// =============================================
//   CELSIUS / FAHRENHEIT TOGGLE
// =============================================
function showCelsius() {
  if (tempC === null) return;

  document.getElementById('temperature').textContent = `${tempC}°C`;
  document.getElementById('feelsLike').textContent   = `Feels like ${feelsLikeC}°C`;
  document.getElementById('btnC').classList.add('active');
  document.getElementById('btnF').classList.remove('active');

  renderForecastRows('C');
}

function showFahrenheit() {
  if (tempC === null) return;

  const tempF      = Math.round(tempC * 9 / 5 + 32);
  const feelsLikeF = Math.round(feelsLikeC * 9 / 5 + 32);

  document.getElementById('temperature').textContent = `${tempF}°F`;
  document.getElementById('feelsLike').textContent   = `Feels like ${feelsLikeF}°F`;
  document.getElementById('btnF').classList.add('active');
  document.getElementById('btnC').classList.remove('active');

  renderForecastRows('F');
}


// =============================================
//   DISPLAY 5-DAY FORECAST
// =============================================
function displayForecast(list) {
  // Group forecast entries by day
  const days = {};
  list.forEach(function(item) {
    const date = new Date(item.dt * 1000).toDateString();
    if (!days[date]) days[date] = [];
    days[date].push(item);
  });

  // Build forecast store — one entry per day (up to 5 days)
  forecastStore = Object.keys(days).slice(0, 5).map(function(date) {
    const entries = days[date];
    const temps   = entries.map(function(e) { return e.main.temp; });

    // Pick the midday entry for the icon
    const midday = entries.find(function(e) {
      const hour = new Date(e.dt * 1000).getHours();
      return hour >= 11 && hour <= 14;
    }) || entries[0];

    return {
      day:  new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      icon: midday.weather[0].icon,
      desc: midday.weather[0].description,
      high: Math.max(...temps),
      low:  Math.min(...temps)
    };
  });

  renderForecastRows('C');
  document.getElementById('forecastCard').style.display = 'block';
}

// Renders the forecast rows in either C or F
function renderForecastRows(unit) {
  const list = document.getElementById('forecastList');
  list.innerHTML = forecastStore.map(function(day) {
    const high = unit === 'C' ? Math.round(day.high) : Math.round(day.high * 9 / 5 + 32);
    const low  = unit === 'C' ? Math.round(day.low)  : Math.round(day.low  * 9 / 5 + 32);
    return `
      <div class="forecast-row">
        <span class="forecast-day">${day.day}</span>
        <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.desc}"/>
        <span class="forecast-desc">${day.desc}</span>
        <span class="forecast-temps">${high}° <span class="low">${low}°</span></span>
      </div>`;
  }).join('');
}


// =============================================
//   SMART TIPS BASED ON WEATHER CONDITIONS
// =============================================
function showSmartTips(data) {
  const temp  = data.main.temp;
  const humid = data.main.humidity;
  const wind  = data.wind.speed * 3.6; // convert m/s to km/h
  const id    = data.weather[0].id;    // weather condition ID from OpenWeatherMap
  const tips  = [];

  // Check weather condition and add relevant tips
  if (id >= 200 && id <= 232) tips.push('⛈️ Thunderstorm — stay indoors and avoid open areas.');
  if (id >= 300 && id <= 531) tips.push('☂️ Rain expected — carry an umbrella.');
  if (id >= 600 && id <= 622) tips.push('❄️ Snow — wear warm waterproof boots and drive carefully.');
  if (id >= 700 && id <= 781) tips.push('🌫️ Poor visibility — drive slowly and use your headlights.');
  if (id === 800 || id === 801) tips.push('☀️ Clear skies — great day to go outside!');
  if (temp > 30)              tips.push('🌡️ Very hot — stay hydrated and wear sunscreen.');
  if (temp < 5)               tips.push('🧥 Very cold — dress in warm layers.');
  if (humid > 75)             tips.push('💧 High humidity — it will feel hotter than it actually is.');
  if (wind > 30)              tips.push('💨 Strong winds — secure any loose items outdoors.');
  if (tips.length === 0)      tips.push('✅ Weather looks fine — enjoy your day!');

  // Put the tips on screen
  document.getElementById('tipsList').innerHTML = tips.map(function(tip) {
    return `<div class="tip-item">${tip}</div>`;
  }).join('');

  document.getElementById('tipsCard').style.display = 'block';
}


// =============================================
//   CHANGE BACKGROUND COLOR BASED ON WEATHER
// =============================================
function applyTheme(id, icon) {
  // Remove any existing theme class
  document.body.className = '';

  const isNight = icon.includes('n');

  if      (id === 800 && !isNight)        document.body.classList.add('sunny');
  else if (id >= 801 && id <= 804)        document.body.classList.add('cloudy');
  else if (id >= 300 && id <= 531)        document.body.classList.add('rainy');
  else if (id >= 200 && id <= 232)        document.body.classList.add('stormy');
  else if (id >= 600 && id <= 622)        document.body.classList.add('snowy');
  else if (id >= 700 && id <= 781)        document.body.classList.add('foggy');
  // default (night or unknown) stays as the dark blue default
}


// =============================================
//   HELPER FUNCTIONS
// =============================================

// Convert a Unix timestamp to a readable time e.g. "06:45 AM"
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Show the loading message and hide cards
function showLoader() {
  document.getElementById('loader').style.display        = 'block';
  document.getElementById('weatherCard').style.display  = 'none';
  document.getElementById('tipsCard').style.display     = 'none';
  document.getElementById('forecastCard').style.display = 'none';
}

// Hide the loading message
function hideLoader() {
  document.getElementById('loader').style.display = 'none';
}

// Show an error message
function showError(message) {
  const box       = document.getElementById('errorBox');
  box.textContent = message;
  box.style.display = 'block';
}

// Hide the error message
function hideError() {
  document.getElementById('errorBox').style.display = 'none';
}
