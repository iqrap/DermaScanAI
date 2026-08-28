const axios = require('axios');

async function fetchWeatherData(apiKey, cityName) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`;
  
  console.log(`🌤️ Fetching fresh weather for: ${cityName}`);
  const response = await axios.get(apiUrl, { timeout: 10000 });
  
  console.log(`✅ Fresh weather data received for ${response.data.name}`);
  return response.data;
}

async function fetchUVIndex(weatherApiKey, lat, lon) {
  try {
    const uvUrl = `https://api.openweathermap.org/data/2.5/uvi?appid=${weatherApiKey}&lat=${lat}&lon=${lon}`;
    const response = await axios.get(uvUrl, { timeout: 10000 });
    return response.data.value;
  } catch (error) {
    console.error('Error fetching UV:', error);
    return null;
  }
}

function getWeatherCategory(temp, condition) {
  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("drizzle") || c.includes("thunderstorm")) return "RAINY";
  if (temp <= 15) return "COLD";
  if (temp >= 30) return "HOT";
  return "NORMAL";
}

module.exports = {
  fetchWeatherData,
  fetchUVIndex,
  getWeatherCategory
};