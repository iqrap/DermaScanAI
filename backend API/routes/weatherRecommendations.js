const express = require('express');
const router = express.Router();
const { getWeatherRecommendations } = require('../services/ModelService');
const { fetchWeatherData, fetchUVIndex, getWeatherCategory } = require('../services/weatherService');
const { validateWeatherRequest } = require('../middleware/validation');

router.post('/weather', validateWeatherRequest, async (req, res) => {
  try {
    const { city, timeOfDay } = req.body;
    
    const weatherApiKey = process.env.WEATHER_API_KEY;
    
    const weatherData = await fetchWeatherData(weatherApiKey, city);
    
    let uvIndex = null;
    if (weatherData.coord) {
      uvIndex = await fetchUVIndex(weatherApiKey, weatherData.coord.lat, weatherData.coord.lon);
    }
    
    const weatherCategory = getWeatherCategory(weatherData.main.temp, weatherData.weather[0].main);
    
    const recommendations = await getWeatherRecommendations(
      weatherData, 
      weatherCategory, 
      timeOfDay || "MORNING", 
      uvIndex
    );
    
    res.json({
      success: true,
      data: {
        weather: weatherData,
        uvIndex,
        weatherCategory,
        recommendations
      }
    });
  } catch (error) {
    console.error('Weather recommendation error:', error);
    res.status(500).json({ 
      error: "Weather Error", 
      message: error.message || "Unable to fetch weather recommendations"
    });
  }
});

module.exports = router;