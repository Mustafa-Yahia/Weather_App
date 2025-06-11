// Enhanced Weather App with Sun Animation, Error Handling, Local Storage, and Performance Optimizations

// Configuration Object
const CONFIG = {
    API_KEY: '95e33592ab075383b22902cc738cb97d',
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    DEFAULT_CITY: 'Amman',
    CACHE_EXPIRY: 15 * 60 * 1000, // 15 minutes cache
    FALLBACK_DATA: {
        cod: 200,
        name: 'Amman',
        main: { temp: 25, humidity: 40 },
        weather: [{ id: 800, main: 'Clear' }],
        wind: { speed: 5 }
    }
};

// DOM Elements
const elements = {
    cityInput: document.querySelector('.city-input'),
    searchBtn: document.querySelector('.search-btn'),
    weatherInfoSection: document.querySelector('.weather-info'),
    notFoundSection: document.querySelector('.not-found'),
    searchCitySection: document.querySelector('.search-city'),
    loadingSpinner: document.querySelector('.loading-spinner'),
    loadingText: document.querySelector('.loading-text'),
    offlineMessage: document.createElement('div'),

    // Weather Info Elements
    countryTxt: document.querySelector('.country-txt'),
    tempTxt: document.querySelector('.temp-txt'),
    conditionTxt: document.querySelector('.condition-txt'),
    humidityValueTxt: document.querySelector('.humidity-value-txt'),
    windValueTxt: document.querySelector('.wind-value-txt'),
    weatherSummaryImg: document.querySelector('.weather-summary-img'),
    currentDateTxt: document.querySelector('.current-date-txt'),
    forecastItemsContainer: document.querySelector('.forecast-items-container')
};

// Weather Icon Mapping with more detailed icons
const WEATHER_ICONS = {
    THUNDERSTORM: 'thunderstorm.svg',
    DRIZZLE: 'drizzle.svg',
    RAIN: { LIGHT: 'rain-light.svg', MODERATE: 'rain.svg', HEAVY: 'rain-heavy.svg' },
    SNOW: 'snow.svg',
    MIST: 'mist.svg',
    SMOKE: 'smoke.svg',
    HAZE: 'haze.svg',
    DUST: 'dust.svg',
    FOG: 'fog.svg',
    SAND: 'sand.svg',
    ASH: 'ash.svg',
    SQUALL: 'squall.svg',
    TORNADO: 'tornado.svg',
    CLEAR: { DAY: 'clear.svg', NIGHT: 'clear-night.svg' },
    CLOUDS: { FEW: 'clouds-few.svg', SCATTERED: 'clouds-scattered.svg', BROKEN: 'clouds-broken.svg', OVERCAST: 'clouds-overcast.svg' }
};

// Cache object
const weatherCache = {
    data: {},
    set: function (key, data) {
        this.data[key] = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem('weatherCache', JSON.stringify(this.data));
    },
    get: function (key) {
        const cached = this.data[key];
        if (cached && (Date.now() - cached.timestamp < CONFIG.CACHE_EXPIRY)) {
            return cached.data;
        }
        return null;
    },
    load: function () {
        const cache = localStorage.getItem('weatherCache');
        if (cache) {
            this.data = JSON.parse(cache);
        }
    }
};

// Initialize cache
weatherCache.load();

// Initialize app with enhanced setup
document.addEventListener('DOMContentLoaded', () => {
    // Initial page load animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);

    setupOfflineDetection();
    createOfflineMessageElement();

    // Load last searched city or default with animation
    const lastCity = localStorage.getItem('lastCity') || CONFIG.DEFAULT_CITY;
    setTimeout(() => {
        updateWeatherInfo(lastCity);
    }, 300);

    setupEventListeners();
    initSunMovement(); // Initialize sun animation

    // Add animation to input container
    const inputContainer = document.querySelector('.input-container');
    inputContainer.classList.add('fade-in');
});

// Sun movement functions
function updateSunPosition() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Calculate current time as percentage (0-1)
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const dayPercentage = totalSeconds / 86400; // 24 hours in seconds

    // Calculate sun position (elliptical path)
    const containerWidth = document.querySelector('.main-container').offsetWidth;
    const sun = document.querySelector('.sun');
    const sunContainer = document.querySelector('.sun-container');

    if (!sun || !sunContainer) return;

    // Calculate position along elliptical path
    const angle = dayPercentage * Math.PI * 2;
    const x = containerWidth * dayPercentage;
    const y = Math.sin(angle) * 150 + 50; // Adjust 150 for height of arc

    sun.style.left = `${x}px`;
    sun.style.top = `${y}px`;

    // Adjust sun size based on time of day (appears larger at sunrise/sunset)
    const sizeFactor = 0.8 + Math.abs(Math.sin(angle)) * 0.4;
    sun.style.width = `${80 * sizeFactor}px`;
    sun.style.height = `${80 * sizeFactor}px`;

    // Change to moon at night
    const isNight = hours < 6 || hours > 18;
    document.body.classList.toggle('night', isNight);

    // Change sun color based on time
    if (hours >= 5 && hours <= 7) { // Sunrise
        sun.style.background = 'radial-gradient(circle, #ff8c00 0%, #ff4500 70%)';
    } else if (hours >= 17 && hours <= 19) { // Sunset
        sun.style.background = 'radial-gradient(circle, #ff4500 0%, #8b0000 70%)';
    }

    // Add glow intensity based on time
    const glowIntensity = isNight ? 0.3 :
        (hours >= 5 && hours <= 7) || (hours >= 17 && hours <= 19) ? 0.6 : 1.0;

    sun.style.boxShadow = `0 0 ${40 * glowIntensity}px ${15 * glowIntensity}px rgba(255, 140, 0, ${0.3 + glowIntensity * 0.3})`;

    // Add opacity change when near horizon
    if ((hours >= 5 && hours <= 7) || (hours >= 17 && hours <= 19)) {
        const horizonFactor = Math.min(
            Math.abs(hours + minutes / 60 - 6),
            Math.abs(hours + minutes / 60 - 18)
        );
        sun.style.opacity = 1 - horizonFactor;
    } else {
        sun.style.opacity = 1;
    }
}

function initSunMovement() {
    updateSunPosition();
    setInterval(updateSunPosition, 60000); // Update every minute
}

function setupOfflineDetection() {
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
}

function handleConnectionChange() {
    if (!navigator.onLine) {
        showSection(elements.offlineMessage);
    } else {
        const currentSection = document.querySelector('.section-visible');
        if (currentSection === elements.offlineMessage) {
            const lastCity = localStorage.getItem('lastCity') || CONFIG.DEFAULT_CITY;
            updateWeatherInfo(lastCity);
        }
    }
}

function createOfflineMessageElement() {
    elements.offlineMessage.className = 'section-message section-visible';
    elements.offlineMessage.innerHTML = `
        <img src="assets/message/offline.png" alt="Offline illustration" loading="lazy" class="float">
        <div>
            <h1>No Internet Connection</h1>
            <h4 class="regular-txt">Please check your connection and try again</h4>
        </div>
    `;
    elements.offlineMessage.style.display = 'none';
    document.querySelector('.main-container').appendChild(elements.offlineMessage);
}

function setupEventListeners() {
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.cityInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') handleSearch();
    });

    // Add retry button for error states
    const retryBtn = document.createElement('button');
    retryBtn.className = 'retry-btn pulse';
    retryBtn.innerHTML = '<span class="material-icons">refresh</span> Try Again';
    retryBtn.addEventListener('click', () => {
        retryBtn.classList.add('pulse');
        const lastCity = localStorage.getItem('lastCity') || CONFIG.DEFAULT_CITY;
        updateWeatherInfo(lastCity);
        setTimeout(() => retryBtn.classList.remove('pulse'), 1000);
    });

    elements.notFoundSection.appendChild(retryBtn);
    elements.offlineMessage.appendChild(retryBtn.cloneNode(true));

    // Add hover effects to weather elements
    elements.weatherSummaryImg?.addEventListener('mouseenter', () => {
        elements.weatherSummaryImg.classList.add('weather-icon-animate');
    });

    elements.weatherSummaryImg?.addEventListener('mouseleave', () => {
        elements.weatherSummaryImg.classList.remove('weather-icon-animate');
    });
}

async function handleSearch() {
    const city = elements.cityInput.value.trim();
    if (city) {
        // Add button click animation
        elements.searchBtn.classList.add('pulse');
        setTimeout(() => elements.searchBtn.classList.remove('pulse'), 300);

        // Sanitize input
        const sanitizedCity = sanitizeInput(city);
        await updateWeatherInfo(sanitizedCity);
        elements.cityInput.value = '';
        elements.cityInput.blur();
    }
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

async function fetchWeatherData(endpoint, city) {
    // Check cache first
    const cacheKey = `${endpoint}-${city.toLowerCase()}`;
    const cachedData = weatherCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    // Check if offline
    if (!navigator.onLine) {
        throw new Error('Offline');
    }

    try {
        const url = `${CONFIG.BASE_URL}/${endpoint}?q=${encodeURIComponent(city)}&appid=${CONFIG.API_KEY}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Cache the successful response
        weatherCache.set(cacheKey, data);

        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);

        // Return cached data even if expired when offline
        if (!navigator.onLine && cachedData) {
            return cachedData;
        }

        if (error.message.includes('404')) {
            return { cod: '404' };
        }

        throw error;
    }
}

function getWeatherIcon(weatherId, isNight = false) {
    const time = new Date().getHours();
    isNight = time < 6 || time > 18;

    if (weatherId >= 200 && weatherId <= 232) return WEATHER_ICONS.THUNDERSTORM;
    if (weatherId >= 300 && weatherId <= 321) return WEATHER_ICONS.DRIZZLE;
    if (weatherId >= 500 && weatherId <= 531) {
        if (weatherId < 502) return WEATHER_ICONS.RAIN.LIGHT;
        if (weatherId < 504) return WEATHER_ICONS.RAIN.MODERATE;
        return WEATHER_ICONS.RAIN.HEAVY;
    }
    if (weatherId >= 600 && weatherId <= 622) return WEATHER_ICONS.SNOW;
    if (weatherId === 701) return WEATHER_ICONS.MIST;
    if (weatherId === 711) return WEATHER_ICONS.SMOKE;
    if (weatherId === 721) return WEATHER_ICONS.HAZE;
    if (weatherId === 731 || weatherId === 761) return WEATHER_ICONS.DUST;
    if (weatherId === 741) return WEATHER_ICONS.FOG;
    if (weatherId === 751) return WEATHER_ICONS.SAND;
    if (weatherId === 762) return WEATHER_ICONS.ASH;
    if (weatherId === 771) return WEATHER_ICONS.SQUALL;
    if (weatherId === 781) return WEATHER_ICONS.TORNADO;
    if (weatherId === 800) return isNight ? WEATHER_ICONS.CLEAR.NIGHT : WEATHER_ICONS.CLEAR.DAY;
    if (weatherId === 801) return WEATHER_ICONS.CLOUDS.FEW;
    if (weatherId === 802) return WEATHER_ICONS.CLOUDS.SCATTERED;
    if (weatherId === 803) return WEATHER_ICONS.CLOUDS.BROKEN;
    if (weatherId === 804) return WEATHER_ICONS.CLOUDS.OVERCAST;

    return WEATHER_ICONS.CLOUDS.OVERCAST;
}

function formatDate(date, options) {
    return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
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
    if (show) {
        elements.loadingSpinner.style.display = 'flex';
        elements.loadingSpinner.classList.add('fade-in');
        elements.loadingSpinner.classList.remove('fade-out');

        // Animate loading text
        if (elements.loadingText) {
            elements.loadingText.style.animation = 'fadeIn 1s infinite alternate';
        }
    } else {
        elements.loadingSpinner.classList.add('fade-out');
        setTimeout(() => {
            elements.loadingSpinner.style.display = 'none';
            elements.loadingSpinner.classList.remove('fade-in');
        }, 300);
    }
}

function showSection(section) {
    // Hide all sections with fade-out animation
    [elements.weatherInfoSection, elements.searchCitySection,
    elements.notFoundSection, elements.offlineMessage].forEach(sec => {
        if (sec) {
            sec.classList.add('fade-out');
            setTimeout(() => {
                sec.style.display = 'none';
                sec.classList.remove('fade-out', 'section-visible');
            }, 300);
        }
    });

    // Show requested section with fade-in animation
    if (section) {
        setTimeout(() => {
            section.style.display = 'flex';
            section.classList.add('fade-in', 'section-visible');

            setTimeout(() => {
                section.classList.remove('fade-in');
            }, 500);
        }, 300);
    }
}

async function updateWeatherInfo(city) {
    showLoading(true);

    try {
        // Check if offline
        if (!navigator.onLine) {
            throw new Error('Offline');
        }

        const weatherData = await fetchWeatherData('weather', city);

        if (weatherData.cod !== 200) {
            showSection(elements.notFoundSection);
            return;
        }

        // Save last successful city
        localStorage.setItem('lastCity', city);

        // Display current weather with animations
        displayCurrentWeather(weatherData);

        // Update forecast with animations
        await updateForecastInfo(city);

        showSection(elements.weatherInfoSection);
    } catch (error) {
        console.error('Error updating weather info:', error);

        if (error.message === 'Offline') {
            showSection(elements.offlineMessage);
        } else {
            // Try to show cached data
            const cacheKey = `weather-${city.toLowerCase()}`;
            const cachedData = weatherCache.get(cacheKey);

            if (cachedData) {
                displayCurrentWeather(cachedData);
                showSection(elements.weatherInfoSection);
            } else {
                showSection(elements.notFoundSection);
            }
        }
    } finally {
        showLoading(false);
    }
}

function displayCurrentWeather(data) {
    const {
        name: city,
        main: { temp, humidity, temp_min, temp_max },
        weather: [{ id, main, description }],
        wind: { speed },
        sys: { country }
    } = data;

    // Sanitize all outputs to prevent XSS
    elements.countryTxt.textContent = `${sanitizeInput(city)}, ${country}`;
    elements.tempTxt.textContent = `${Math.round(temp)} °C`;
    elements.conditionTxt.textContent = sanitizeInput(description);
    elements.humidityValueTxt.textContent = `${humidity}%`;
    elements.windValueTxt.textContent = `${speed} m/s`;

    elements.currentDateTxt.textContent = getCurrentDate();

    // Lazy load image with fallback and animation
    const iconPath = `assets/weather/${getWeatherIcon(id)}`;
    elements.weatherSummaryImg.src = '';
    elements.weatherSummaryImg.classList.add('fade-out');

    setTimeout(() => {
        elements.weatherSummaryImg.src = iconPath;
        elements.weatherSummaryImg.alt = `${main} weather`;
        elements.weatherSummaryImg.classList.remove('fade-out');
        elements.weatherSummaryImg.classList.add('fade-in');

        setTimeout(() => {
            elements.weatherSummaryImg.classList.remove('fade-in');
        }, 500);

        elements.weatherSummaryImg.onerror = () => {
            elements.weatherSummaryImg.src = 'assets/weather/clouds.svg';
        };
    }, 300);
}

async function updateForecastInfo(city) {
    try {
        const forecastData = await fetchWeatherData('forecast', city);

        // Clear previous forecast items with animation
        elements.forecastItemsContainer.classList.add('fade-out');
        setTimeout(() => {
            elements.forecastItemsContainer.innerHTML = '';
            elements.forecastItemsContainer.classList.remove('fade-out');
        }, 300);

        if (!forecastData.list) {
            console.error('Invalid forecast data structure');
            return;
        }

        // Group forecasts by day
        const dailyForecasts = {};
        forecastData.list.forEach(forecast => {
            const date = new Date(forecast.dt * 1000).toLocaleDateString();
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = [];
            }
            dailyForecasts[date].push(forecast);
        });

        // Get forecast for next 5 days (excluding today)
        const today = new Date().toLocaleDateString();
        const nextDays = Object.keys(dailyForecasts)
            .filter(date => date !== today)
            .slice(0, 5);

        // Create forecast items for each day with staggered animations
        setTimeout(() => {
            nextDays.forEach((date, index) => {
                // Get midday forecast or first available
                const dayForecasts = dailyForecasts[date];
                const middayForecast = dayForecasts.find(f =>
                    new Date(f.dt * 1000).getHours() === 12) || dayForecasts[0];

                setTimeout(() => {
                    createForecastItem(middayForecast, index);
                }, index * 100);
            });
        }, 300);
    } catch (error) {
        console.error('Error updating forecast info:', error);

        // If offline, try to show cached forecast
        if (!navigator.onLine) {
            const cacheKey = `forecast-${city.toLowerCase()}`;
            const cachedData = weatherCache.get(cacheKey);

            if (cachedData && cachedData.list) {
                setTimeout(() => {
                    cachedData.list.slice(0, 5).forEach((forecast, index) => {
                        setTimeout(() => {
                            createForecastItem(forecast, index);
                        }, index * 100);
                    });
                }, 300);
            }
        }
    }
}

function createForecastItem(forecast, index) {
    const {
        dt: timestamp,
        weather: [{ id, main }],
        main: { temp }
    } = forecast;

    const date = new Date(timestamp * 1000);
    const dayOfWeek = formatDate(date, { weekday: 'short' });

    const forecastItem = document.createElement('div');
    forecastItem.className = 'forecast-item';
    forecastItem.style.setProperty('--order', index);
    forecastItem.style.opacity = '0';
    forecastItem.style.transform = 'translateY(10px)';

    forecastItem.innerHTML = `
        <h5 class="forecast-item-date regular-txt">${sanitizeInput(dayOfWeek)}</h5>
        <img src="assets/weather/${getWeatherIcon(id)}" 
             alt="${sanitizeInput(main)}" 
             class="forecast-item-img"
             loading="lazy"
             onerror="this.src='assets/weather/clouds.svg'">
        <h5 class="forecast-item-temp">${Math.round(temp)} °C</h5>
    `;

    elements.forecastItemsContainer.appendChild(forecastItem);

    // Animate each item sequentially
    setTimeout(() => {
        forecastItem.style.transition = 'all 0.3s ease-out';
        forecastItem.style.opacity = '1';
        forecastItem.style.transform = 'translateY(0)';
    }, 100 + (index * 50));

    // Add hover effect
    forecastItem.addEventListener('mouseenter', () => {
        forecastItem.style.transform = 'translateY(-5px)';
        forecastItem.querySelector('.forecast-item-img').style.transform = 'scale(1.1)';
    });

    forecastItem.addEventListener('mouseleave', () => {
        forecastItem.style.transform = 'translateY(0)';
        forecastItem.querySelector('.forecast-item-img').style.transform = 'scale(1)';
    });
}

// Service Worker Registration for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Change background based on time of day
function updateBackgroundBasedOnTime() {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 18;
    const body = document.body;

    // Add smooth transition class
    body.classList.add('bg-transition');

    if (isNight) {
        body.style.backgroundImage = "url('assets/night-bg.jpg')";
        document.querySelector('body::before').style.background = "rgba(0, 0, 0, 0.4)";
    } else {
        body.style.backgroundImage = "url('assets/bg.jpg')";
        document.querySelector('body::before').style.background = "rgba(0, 0, 0, 0.15)";
    }

    // Remove transition class after animation completes
    setTimeout(() => {
        body.classList.remove('bg-transition');
    }, 1000);
}

// Update background on load and every hour
updateBackgroundBasedOnTime();
setInterval(updateBackgroundBasedOnTime, 3600000); // Check every hour


