// Constants
const API_KEY = '95e33592ab075383b22902cc738cb97d';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const DEFAULT_CITY = 'Amman';

// DOM Elements
const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');
const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');
const loadingSpinner = document.querySelector('.loading-spinner');

// Weather Info Elements
const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.wind-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');
const forecastItemsContainer = document.querySelector('.forecast-items-container');

// Weather Icon Mapping
const WEATHER_ICONS = {
    THUNDERSTORM: 'thunderstorm.svg',
    DRIZZLE: 'drizzle.svg',
    RAIN: 'rain.svg',
    SNOW: 'snow.svg',
    ATMOSPHERE: 'atmosphere.svg',
    CLEAR: 'clear.svg',
    CLOUDS: 'clouds.svg'
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Load default city weather on startup
    updateWeatherInfo(DEFAULT_CITY);

    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') handleSearch();
    });
}

function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        updateWeatherInfo(city);
        cityInput.value = '';
        cityInput.blur();
    }
}

async function fetchWeatherData(endpoint, city) {
    try {
        const url = `${BASE_URL}/${endpoint}?q=${city}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return { cod: '404' }; // Return not found status
    }
}

function getWeatherIcon(weatherId) {
    if (weatherId <= 232) return WEATHER_ICONS.THUNDERSTORM;
    if (weatherId <= 321) return WEATHER_ICONS.DRIZZLE;
    if (weatherId <= 531) return WEATHER_ICONS.RAIN;
    if (weatherId <= 622) return WEATHER_ICONS.SNOW;
    if (weatherId <= 781) return WEATHER_ICONS.ATMOSPHERE;
    if (weatherId === 800) return WEATHER_ICONS.CLEAR;
    return WEATHER_ICONS.CLOUDS;
}

function formatDate(date, options) {
    return new Date(date).toLocaleDateString('en-US', options);
}

function getCurrentDate() {
    const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    };
    return formatDate(new Date(), options);
}

function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
}

function showSection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection]
        .forEach(sec => sec.style.display = 'none');

    if (section) section.style.display = 'flex';
}

async function updateWeatherInfo(city) {
    showLoading(true);

    try {
        const weatherData = await fetchWeatherData('weather', city);

        if (weatherData.cod !== 200) {
            showSection(notFoundSection);
            return;
        }

        // Extract and display current weather data
        displayCurrentWeather(weatherData);

        // Update forecast data
        await updateForecastInfo(city);

        showSection(weatherInfoSection);
    } catch (error) {
        console.error('Error updating weather info:', error);
        showSection(notFoundSection);
    } finally {
        showLoading(false);
    }
}

function displayCurrentWeather(data) {
    const {
        name: country,
        main: { temp, humidity },
        weather: [{ id, main }],
        wind: { speed }
    } = data;

    countryTxt.textContent = country;
    tempTxt.textContent = `${Math.round(temp)} °C`;
    conditionTxt.textContent = main;
    humidityValueTxt.textContent = `${humidity}%`;
    windValueTxt.textContent = `${speed} M/s`;

    currentDateTxt.textContent = getCurrentDate();
    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;
    weatherSummaryImg.alt = `${main} weather`;
}

async function updateForecastInfo(city) {
    try {
        const forecastData = await fetchWeatherData('forecast', city);

        // Clear previous forecast items
        forecastItemsContainer.innerHTML = '';

        // Filter forecasts for midday (12:00) of each day
        const middayForecasts = forecastData.list.filter(forecast => {
            return forecast.dt_txt.includes('12:00:00');
        }).slice(0, 5); // Get next 5 days

        // Create forecast items
        middayForecasts.forEach(forecast => {
            createForecastItem(forecast);
        });
    } catch (error) {
        console.error('Error updating forecast info:', error);
    }
}

function createForecastItem(forecast) {
    const {
        dt_txt: date,
        weather: [{ id }],
        main: { temp }
    } = forecast;

    const dateOptions = { weekday: 'short' };
    const dayOfWeek = formatDate(date, dateOptions);

    const forecastItem = document.createElement('div');
    forecastItem.className = 'forecast-item';
    forecastItem.innerHTML = `
        <h5 class="forecast-item-date regular-txt">${dayOfWeek}</h5>
        <img src="assets/weather/${getWeatherIcon(id)}" 
             alt="${forecast.weather[0].main} weather" 
             class="forecast-item-img"
             loading="lazy">
        <h5 class="forecast-item-temp">${Math.round(temp)} °C</h5>
    `;

    forecastItemsContainer.appendChild(forecastItem);
}