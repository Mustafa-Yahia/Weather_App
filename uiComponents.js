// UI Components Module
class UIComponents {
    constructor() {
        this.weatherService = new WeatherService();
        this.init();
    }

    init() {
        // Initialize theme from localStorage
        this.initTheme();

        // Initialize language from localStorage
        this.initLanguage();
    }

    initTheme() {
        const darkTheme = localStorage.getItem('darkTheme') === 'true';
        if (darkTheme) {
            document.body.classList.add('dark-theme');
            const icon = document.querySelector('.theme-toggle .material-symbols-outlined');
            if (icon) icon.textContent = 'light_mode';
        }
    }

    initLanguage() {
        const lang = localStorage.getItem('language') || 'en';
        const select = document.getElementById('language-select');
        if (select) select.value = lang;
    }

    updateCurrentWeather(data) {
        const current = data.current;

        // Update location and date
        document.querySelector('.location-name').textContent = `${data.name}, ${data.country}`;
        document.querySelector('.current-date').textContent = this.formatDate(current.dt, 'weekday');
        document.querySelector('.current-time').textContent = this.formatDate(current.dt, 'time');

        // Update temperature and weather
        document.querySelector('.current-temp').textContent = `${Math.round(current.temp)}°`;
        document.querySelector('.feels-like').textContent = `Feels like: ${Math.round(current.feels_like)}°`;
        document.querySelector('.weather-condition').textContent = current.weather.main;

        // Update weather icon
        const iconPath = `assets/weather-icons/${this.weatherService.getWeatherIcon(current.weather.id)}`;
        document.getElementById('current-weather-icon').src = iconPath;
        document.getElementById('current-weather-icon').alt = current.weather.description;

        // Update weather details
        document.getElementById('humidity-value').textContent = `${current.humidity}%`;
        document.getElementById('wind-value').textContent = `${current.wind_speed} km/h`;
        document.getElementById('pressure-value').textContent = `${current.pressure} hPa`;
        document.getElementById('visibility-value').textContent = `${current.visibility} km`;
        document.getElementById('uv-value').textContent = current.uvi;
        document.getElementById('dew-point-value').textContent = `${Math.round(this.calculateDewPoint(current.temp, current.humidity))}°`;
    }

    updateHourlyForecast(hourlyData) {
        const container = document.querySelector('.hourly-scroll-container');
        container.innerHTML = '';

        hourlyData.forEach(hour => {
            const hourElement = document.createElement('div');
            hourElement.className = 'hourly-item';

            const time = this.formatDate(hour.dt, 'hour');
            const iconPath = `assets/weather-icons/${this.weatherService.getWeatherIcon(hour.weather.id)}`;

            hourElement.innerHTML = `
                <div class="hourly-time">${time}</div>
                <img src="${iconPath}" alt="${hour.weather.description}" class="hourly-icon" loading="lazy">
                <div class="hourly-temp">${Math.round(hour.temp)}°</div>
            `;

            container.appendChild(hourElement);
        });
    }

    updateDailyForecast(dailyData) {
        const container = document.querySelector('.daily-container');
        container.innerHTML = '';

        dailyData.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'daily-item';

            const weekday = this.formatDate(day.dt, 'weekday');
            const iconPath = `assets/weather-icons/${this.weatherService.getWeatherIcon(day.weather.id)}`;

            dayElement.innerHTML = `
                <div class="daily-day">${weekday}</div>
                <div class="daily-weather">
                    <img src="${iconPath}" alt="${day.weather.description}" class="daily-icon" loading="lazy">
                    <div class="daily-condition">${day.weather.main}</div>
                </div>
                <div class="daily-temps">
                    <span class="daily-max">${Math.round(day.temp_max)}°</span>
                    <span class="daily-min">${Math.round(day.temp_min)}°</span>
                </div>
            `;

            container.appendChild(dayElement);
        });
    }

    updateAirQuality(aqData) {
        const aqiElement = document.querySelector('.aqi-value');
        const aqiLevelElement = document.querySelector('.aqi-level');

        aqiElement.textContent = aqData.aqi;
        aqiLevelElement.textContent = aqData.level.level;
        aqiLevelElement.className = 'aqi-level ' + aqData.level.color;

        // Update pollutant values
        document.querySelector('.pollutant:nth-child(1) .pollutant-value').textContent =
            `${aqData.components.pm2_5.toFixed(1)} µg/m³`;
        document.querySelector('.pollutant:nth-child(2) .pollutant-value').textContent =
            `${aqData.components.pm10.toFixed(1)} µg/m³`;
        document.querySelector('.pollutant:nth-child(3) .pollutant-value').textContent =
            `${aqData.components.o3.toFixed(1)} µg/m³`;
    }

    updateAlerts(alerts) {
        const alertsSection = document.querySelector('.weather-alerts');
        const container = document.querySelector('.alerts-container');
        container.innerHTML = '';

        alerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = 'alert-item';

            alertElement.innerHTML = `
                <span class="material-symbols-outlined alert-icon">warning</span>
                <div class="alert-content">
                    <div class="alert-title">${alert.event}</div>
                    <p class="alert-description">${alert.description}</p>
                    <div class="alert-time">Until ${this.formatDate(alert.end, 'datetime')}</div>
                </div>
            `;

            container.appendChild(alertElement);
        });

        alertsSection.style.display = 'block';
    }

    formatDate(timestamp, format = 'datetime') {
        const date = new Date(timestamp * 1000);
        const options = {};

        switch (format) {
            case 'weekday':
                options.weekday = 'short';
                break;
            case 'hour':
                options.hour = 'numeric';
                break;
            case 'time':
                options.hour = 'numeric';
                options.minute = 'numeric';
                break;
            case 'date':
                options.day = 'numeric';
                options.month = 'short';
                break;
            case 'datetime':
                options.day = 'numeric';
                options.month = 'short';
                options.hour = 'numeric';
                options.minute = 'numeric';
                break;
            default:
                options.day = 'numeric';
                options.month = 'short';
                options.hour = 'numeric';
                options.minute = 'numeric';
        }

        return date.toLocaleString(navigator.language, options);
    }

    calculateDewPoint(temp, humidity) {
        // Magnus formula for dew point calculation
        const a = 17.27;
        const b = 237.7;
        const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
        return (b * alpha) / (a - alpha);
    }

    showLoading(show) {
        const loader = document.querySelector('.loading-overlay');
        loader.style.display = show ? 'flex' : 'none';
    }

    showError(message = 'Unable to load weather data. Please try again later.') {
        const errorElement = document.querySelector('.error-message');
        document.querySelector('.error-description').textContent = message;
        errorElement.style.display = 'flex';
    }

    hideError() {
        document.querySelector('.error-message').style.display = 'none';
    }

    openNav() {
        document.querySelector('.side-nav').classList.add('open');
    }

    closeNav() {
        document.querySelector('.side-nav').classList.remove('open');
    }
}

export default UIComponents;