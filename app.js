// Main Application Module
import WeatherService from './weatherService.js';
import UIComponents from './uiComponents.js';

class WeatherApp {
    constructor() {
        this.weatherService = new WeatherService();
        this.ui = new UIComponents();
        this.currentLocation = null;
        this.savedLocations = [];
        this.init();
    }

    async init() {
        // Load saved locations from localStorage
        this.loadSavedLocations();

        // Set up event listeners
        this.setupEventListeners();

        // Check geolocation permission and load weather
        this.loadInitialWeather();

        // Register service worker for PWA
        this.registerServiceWorker();
    }

    loadSavedLocations() {
        const saved = localStorage.getItem('savedLocations');
        if (saved) {
            this.savedLocations = JSON.parse(saved);
        }
    }

    setupEventListeners() {
        // Search functionality
        document.querySelector('.search-btn').addEventListener('click', () => this.handleSearch());
        document.querySelector('.city-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Location button
        document.querySelector('.location-btn').addEventListener('click', () => this.useCurrentLocation());

        // Theme toggle
        document.querySelector('.theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Menu toggle
        document.querySelector('.menu-btn').addEventListener('click', () => this.ui.openNav());
        document.querySelector('.close-nav-btn').addEventListener('click', () => this.ui.closeNav());

        // Retry button for error
        document.querySelector('.retry-btn').addEventListener('click', () => this.loadInitialWeather());

        // Language selector
        document.getElementById('language-select').addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });
    }

    async loadInitialWeather() {
        try {
            this.ui.showLoading(true);

            // Try to get cached weather first
            const cachedWeather = this.weatherService.getCachedWeather();
            if (cachedWeather) {
                this.updateWeatherUI(cachedWeather);
                this.ui.showLoading(false);
                return;
            }

            // Try geolocation
            const position = await this.getGeolocation();
            if (position) {
                const { latitude, longitude } = position.coords;
                const weatherData = await this.weatherService.getWeatherByCoords(latitude, longitude);
                this.updateWeatherUI(weatherData);
                this.currentLocation = weatherData.name;
            } else {
                // Fallback to default city
                await this.updateWeatherInfo('Amman');
            }
        } catch (error) {
            console.error('Error loading initial weather:', error);
            this.ui.showError();
        } finally {
            this.ui.showLoading(false);
        }
    }

    async handleSearch() {
        const input = document.querySelector('.city-input');
        const city = input.value.trim();

        if (city) {
            try {
                this.ui.showLoading(true);
                await this.updateWeatherInfo(city);
                input.value = '';
            } catch (error) {
                console.error('Error searching for city:', error);
                this.ui.showError();
            } finally {
                this.ui.showLoading(false);
            }
        }
    }

    async updateWeatherInfo(city) {
        try {
            const weatherData = await this.weatherService.getWeatherByCity(city);
            this.updateWeatherUI(weatherData);
            this.currentLocation = weatherData.name;

            // Cache the weather data
            this.weatherService.cacheWeather(weatherData);
        } catch (error) {
            throw error;
        }
    }

    updateWeatherUI(weatherData) {
        // Update current weather
        this.ui.updateCurrentWeather(weatherData);

        // Update hourly forecast
        this.ui.updateHourlyForecast(weatherData.hourly);

        // Update daily forecast
        this.ui.updateDailyForecast(weatherData.daily);

        // Update air quality
        if (weatherData.airQuality) {
            this.ui.updateAirQuality(weatherData.airQuality);
        }

        // Update alerts if any
        if (weatherData.alerts && weatherData.alerts.length > 0) {
            this.ui.updateAlerts(weatherData.alerts);
        }

        // Hide error message if shown
        this.ui.hideError();
    }

    async useCurrentLocation() {
        try {
            this.ui.showLoading(true);
            const position = await this.getGeolocation();
            if (position) {
                const { latitude, longitude } = position.coords;
                const weatherData = await this.weatherService.getWeatherByCoords(latitude, longitude);
                this.updateWeatherUI(weatherData);
                this.currentLocation = weatherData.name;
            }
        } catch (error) {
            console.error('Error getting current location:', error);
            this.ui.showError('Please enable location services to use this feature.');
        } finally {
            this.ui.showLoading(false);
        }
    }

    getGeolocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                position => resolve(position),
                error => reject(error),
                { timeout: 10000 }
            );
        });
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('darkTheme', isDark);

        // Update theme icon
        const icon = document.querySelector('.theme-toggle .material-symbols-outlined');
        icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }

    changeLanguage(lang) {
        // In a real app, this would load translations and update the UI
        console.log('Changing language to:', lang);
        localStorage.setItem('language', lang);
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('ServiceWorker registration successful');
                }).catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});