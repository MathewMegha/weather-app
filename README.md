# Megha Mathew's Weather App

A simple weather app I built using HTML, CSS, and JavaScript. You can search for any city and get the current weather, a 5-day forecast, and some helpful tips based on the conditions.

## What it does

- Search weather by city name, zip code, or landmark
- Use your current location to get local weather
- Shows temperature, humidity, wind speed, visibility, and pressure
- Sunrise and sunset times
- Toggle between Celsius and Fahrenheit
- 5-day forecast
- Smart tips based on the weather (like reminding you to bring an umbrella)
- The background color changes depending on the weather — sunny, rainy, stormy, etc.
- Works on mobile and desktop

## How to run it

Just download the files and open index.html in your browser. No installation needed.

If that doesn't work, you can run a local server:

```
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## API used

I used the OpenWeatherMap API to get the weather data. You can get a free API key at https://openweathermap.org. Once you have it, paste it into line 5 of script.js.

## Files

- index.html — the structure of the page
- style.css — all the styling
- script.js — all the logic and API calls

## Author

Megha Mathew
