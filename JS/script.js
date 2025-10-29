// WeatherCast - Weather App JavaScript
class WeatherApp {
    constructor() {
        // Flat theme flag to disable 3D interactions
        this.FLAT_THEME = true;
        // Primary API
        this.baseURL = 'https://api.openweathermap.org/data/2.5/weather';
        this.apiKey = 'b6907d289e10d714a6e88b30761fae22';
        
        // Alternative free API that works without CORS issues
        this.alternativeAPI = 'https://wttr.in/';
        
        // Popular cities for search suggestions
        this.popularCities = [
            'London', 'New York', 'Paris', 'Tokyo', 'Sydney',
            'Berlin', 'Rome', 'Madrid', 'Amsterdam', 'Barcelona',
            'Moscow', 'Istanbul', 'Dubai', 'Singapore', 'Hong Kong',
            'Los Angeles', 'Chicago', 'Toronto', 'Vancouver', 'Mumbai',
            'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad'
        ];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDefaultWeather();
    }

    bindEvents() {
        const searchBtn = document.getElementById('searchBtn');
        const locationBtn = document.getElementById('locationBtn');
        const cityInput = document.getElementById('cityInput');

        searchBtn.addEventListener('click', () => this.searchWeather());
        locationBtn.addEventListener('click', () => this.getCurrentLocationWeather());
        
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchWeather();
            }
        });

        // Add input validation and search suggestions
        cityInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
            this.handleSearchInput(e.target.value);
        });

        // Add search suggestions
        cityInput.addEventListener('focus', () => {
            this.showSearchSuggestions();
        });

        cityInput.addEventListener('blur', () => {
            // Delay hiding suggestions to allow clicking on them
            setTimeout(() => {
                this.hideSearchSuggestions();
            }, 200);
        });
    }

    async loadDefaultWeather() {
        // Check if user has a last searched city
        const lastCity = localStorage.getItem('lastSearchedCity');
        if (lastCity) {
            this.getWeatherByCity(lastCity);
        } else {
            // Load weather for a default city (London)
            this.getWeatherByCity('London');
        }
    }

    showDemoWeather() {
        // Demo weather data for demonstration
        const demoData = {
            name: 'London',
            sys: { country: 'GB' },
            main: {
                temp: 15,
                feels_like: 13,
                humidity: 75
            },
            weather: [{ 
                main: 'Clouds', 
                description: 'partly cloudy',
                icon: '02d'
            }],
            visibility: 10000,
            wind: { speed: 3.5 }
        };
        
        this.hideLoading();
        this.hideError();
        this.displayWeather(demoData);
    }

    async searchWeather() {
        const cityInput = document.getElementById('cityInput');
        const city = cityInput.value.trim();
        
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }

        await this.getWeatherByCity(city);
    }

    async getWeatherByCity(city) {
        this.showLoading();
        
        try {
            // Try alternative API first (works without CORS)
            const alternativeData = await this.tryAlternativeAPI(city);
            if (alternativeData) {
                this.displayWeather(alternativeData);
                return;
            }
            
            // Fallback to OpenWeatherMap with proxies
            const apiURL = `${this.baseURL}?q=${city}&appid=${this.apiKey}&units=metric`;
            const proxies = [
                'https://api.allorigins.win/raw?url=',
                'https://cors-anywhere.herokuapp.com/',
                'https://thingproxy.freeboard.io/fetch/'
            ];
            
            // Try direct call first
            try {
                const response = await fetch(apiURL);
                if (response.ok) {
                    const data = await response.json();
                    if (data.cod === 200) {
                        this.displayWeather(data);
                        return;
                    }
                }
            } catch (directError) {
                console.log('Direct API call failed, trying proxies...');
            }
            
            // Try each proxy
            for (const proxy of proxies) {
                try {
                    console.log(`Trying proxy: ${proxy}`);
                    const response = await fetch(proxy + encodeURIComponent(apiURL));
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data.cod && data.cod !== 200) {
                            if (data.cod === 404) {
                                throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
                            } else if (data.cod === 401) {
                                throw new Error('API key invalid. Please contact support.');
                            } else {
                                throw new Error(`API Error: ${data.message || 'Unknown error'}`);
                            }
                        }
                        
                        this.displayWeather(data);
                        return;
                    }
                } catch (proxyError) {
                    console.log(`Proxy ${proxy} failed:`, proxyError.message);
                    continue;
                }
            }
            
            // If all methods failed, show demo data
            throw new Error('All API methods failed. Using demo data.');
            
        } catch (error) {
            console.error('Weather API Error:', error);
            this.showDemoWeather();
            this.showError(`Using demo data for "${city}". Real weather data requires hosting on a web server.`);
        }
    }

    async tryAlternativeAPI(city) {
        try {
            // Try wttr.in API which works without CORS
            const response = await fetch(`${this.alternativeAPI}${encodeURIComponent(city)}?format=j1`);
            if (response.ok) {
                const data = await response.json();
                
                // Convert wttr.in format to our expected format
                const weatherData = {
                    name: data.nearest_area[0].areaName[0].value,
                    sys: { country: data.nearest_area[0].country[0].value },
                    main: {
                        temp: parseFloat(data.current_condition[0].temp_C),
                        feels_like: parseFloat(data.current_condition[0].FeelsLikeC),
                        humidity: parseInt(data.current_condition[0].humidity)
                    },
                    weather: [{
                        main: this.getWeatherMain(data.current_condition[0].weatherDesc[0].value),
                        description: data.current_condition[0].weatherDesc[0].value.toLowerCase(),
                        icon: this.getWeatherIcon(data.current_condition[0].weatherDesc[0].value)
                    }],
                    visibility: parseInt(data.current_condition[0].visibility) * 1000, // Convert km to m
                    wind: { speed: parseFloat(data.current_condition[0].windspeedKmph) / 3.6 } // Convert km/h to m/s
                };
                
                return weatherData;
            }
        } catch (error) {
            console.log('Alternative API failed:', error.message);
        }
        return null;
    }

    getWeatherMain(description) {
        const desc = description.toLowerCase();
        if (desc.includes('sun') || desc.includes('clear')) return 'Clear';
        if (desc.includes('cloud')) return 'Clouds';
        if (desc.includes('rain')) return 'Rain';
        if (desc.includes('snow')) return 'Snow';
        if (desc.includes('storm') || desc.includes('thunder')) return 'Thunderstorm';
        if (desc.includes('mist') || desc.includes('fog')) return 'Mist';
        return 'Clouds';
    }

    getWeatherIcon(description) {
        const desc = description.toLowerCase();
        if (desc.includes('sun') || desc.includes('clear')) return '01d';
        if (desc.includes('cloud')) return '02d';
        if (desc.includes('rain')) return '10d';
        if (desc.includes('snow')) return '13d';
        if (desc.includes('storm') || desc.includes('thunder')) return '11d';
        return '02d';
    }

    async tryAlternativeLocationAPI(latitude, longitude) {
        try {
            // Try wttr.in API with coordinates
            const response = await fetch(`${this.alternativeAPI}${latitude},${longitude}?format=j1`);
            if (response.ok) {
                const data = await response.json();
                
                // Convert wttr.in format to our expected format
                const weatherData = {
                    name: data.nearest_area[0].areaName[0].value,
                    sys: { country: data.nearest_area[0].country[0].value },
                    main: {
                        temp: parseFloat(data.current_condition[0].temp_C),
                        feels_like: parseFloat(data.current_condition[0].FeelsLikeC),
                        humidity: parseInt(data.current_condition[0].humidity)
                    },
                    weather: [{
                        main: this.getWeatherMain(data.current_condition[0].weatherDesc[0].value),
                        description: data.current_condition[0].weatherDesc[0].value.toLowerCase(),
                        icon: this.getWeatherIcon(data.current_condition[0].weatherDesc[0].value)
                    }],
                    visibility: parseInt(data.current_condition[0].visibility) * 1000, // Convert km to m
                    wind: { speed: parseFloat(data.current_condition[0].windspeedKmph) / 3.6 } // Convert km/h to m/s
                };
                
                return weatherData;
            }
        } catch (error) {
            console.log('Alternative location API failed:', error.message);
        }
        return null;
    }

    async getCurrentLocationWeather() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }

        this.showLoading();

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    // Try alternative API first for location-based weather
                    const alternativeData = await this.tryAlternativeLocationAPI(latitude, longitude);
                    if (alternativeData) {
                        this.displayWeather(alternativeData);
                        return;
                    }
                    
                    // Fallback to OpenWeatherMap with proxies
                    const proxies = [
                        'https://api.allorigins.win/raw?url=',
                        'https://cors-anywhere.herokuapp.com/',
                        'https://thingproxy.freeboard.io/fetch/'
                    ];
                    
                    const apiURL = `${this.baseURL}?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`;
                    
                    // Try direct call first
                    try {
                        const response = await fetch(apiURL);
                        if (response.ok) {
                            const data = await response.json();
                            if (data.cod === 200) {
                                this.displayWeather(data);
                                return;
                            }
                        }
                    } catch (directError) {
                        console.log('Direct location API call failed, trying proxies...');
                    }
                    
                    // Try each proxy
                    for (const proxy of proxies) {
                        try {
                            console.log(`Trying location proxy: ${proxy}`);
                            const response = await fetch(proxy + encodeURIComponent(apiURL));
                            
                            if (response.ok) {
                                const data = await response.json();
                                
                                if (data.cod && data.cod !== 200) {
                                    if (data.cod === 401) {
                                        throw new Error('API key invalid. Please contact support.');
                                    } else {
                                        throw new Error(`API Error: ${data.message || 'Unable to fetch weather data for your location.'}`);
                                    }
                                }
                                
                                this.displayWeather(data);
                                return;
                            }
                        } catch (proxyError) {
                            console.log(`Location proxy ${proxy} failed:`, proxyError.message);
                            continue;
                        }
                    }
                    
                    // If all methods failed, show demo data
                    throw new Error('All location API methods failed. Using demo data.');
                    
                } catch (error) {
                    console.error('Location Weather API Error:', error);
                    this.showDemoWeather();
                    this.showError('Using demo data for your location. Real weather data requires hosting on a web server.');
                }
            },
            (error) => {
                console.error('Geolocation Error:', error);
                let errorMessage = 'Unable to get your location. ';
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage += 'Please allow location access or try searching for a city.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage += 'Location information is unavailable. Please try searching for a city.';
                } else {
                    errorMessage += 'Please try searching for a city.';
                }
                this.showError(errorMessage);
            }
        );
    }

    displayWeather(data) {
        this.hideLoading();
        this.hideError();
        
        const weatherCard = document.getElementById('weatherCard');
        weatherCard.style.display = 'block';

        // Update location
        document.getElementById('cityName').textContent = data.name;
        document.getElementById('countryName').textContent = data.sys.country;

        // Update temperature
        document.getElementById('temperature').textContent = Math.round(data.main.temp);

        // Update weather description
        document.getElementById('weatherDescription').textContent = data.weather[0].description;

        // Update weather icon
        this.updateWeatherIcon(data.weather[0].main, data.weather[0].icon);

        // Update details with proper formatting
        document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('windSpeed').textContent = `${data.wind.speed} m/s`;
        document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;

        // Add weather-based background animation
        this.updateBackgroundAnimation(data.weather[0].main);

        // Simple fade-in for flat theme
        weatherCard.style.opacity = '0';
        setTimeout(() => {
            weatherCard.style.transition = 'opacity 0.3s ease';
            weatherCard.style.opacity = '1';
        }, 50);

        // Clear search input
        document.getElementById('cityInput').value = '';

        // Store last searched city
        localStorage.setItem('lastSearchedCity', data.name);
    }

    updateWeatherIcon(weatherMain, iconCode) {
        const weatherIcon = document.getElementById('weatherIcon');
        const iconMap = {
            'Clear': 'fas fa-sun',
            'Clouds': 'fas fa-cloud',
            'Rain': 'fas fa-cloud-rain',
            'Drizzle': 'fas fa-cloud-drizzle',
            'Thunderstorm': 'fas fa-bolt',
            'Snow': 'fas fa-snowflake',
            'Mist': 'fas fa-smog',
            'Fog': 'fas fa-smog',
            'Haze': 'fas fa-smog'
        };

        const iconClass = iconMap[weatherMain] || 'fas fa-cloud-sun';
        weatherIcon.innerHTML = `<i class="${iconClass}"></i>`;
        
        // Flat theme color accents by weather
        const colorMap = {
            'Clear': '#00d4ff',
            'Clouds': '#00d4ff',
            'Rain': '#00d4ff',
            'Drizzle': '#00d4ff',
            'Thunderstorm': '#ff006e',
            'Snow': '#8338ec',
            'Mist': '#00d4ff',
            'Fog': '#00d4ff',
            'Haze': '#00d4ff'
        };
        weatherIcon.style.color = colorMap[weatherMain] || '#00d4ff';
        weatherIcon.style.textShadow = 'none';
        weatherIcon.style.animation = 'none';
    }

    updateBackgroundAnimation(weatherMain) {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        // Remove existing weather classes
        hero.classList.remove('sunny', 'cloudy', 'rainy', 'stormy', 'snowy');

        // Add appropriate weather class
        switch(weatherMain) {
            case 'Clear':
                hero.classList.add('sunny');
                break;
            case 'Clouds':
                hero.classList.add('cloudy');
                break;
            case 'Rain':
            case 'Drizzle':
                hero.classList.add('rainy');
                break;
            case 'Thunderstorm':
                hero.classList.add('stormy');
                break;
            case 'Snow':
                hero.classList.add('snowy');
                break;
            default:
                hero.classList.add('cloudy');
        }
    }

    showLoading() {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('weatherCard').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
    }

    showError(message) {
        this.hideLoading();
        document.getElementById('weatherCard').style.display = 'none';
        
        const errorState = document.getElementById('errorState');
        const errorMessage = document.getElementById('errorMessage');
        
        // Enhanced error messages with helpful suggestions
        let enhancedMessage = message;
        if (message.includes('not found')) {
            enhancedMessage += '\n\nTry searching for major cities like: New York, London, Paris, Tokyo';
        } else if (message.includes('network') || message.includes('CORS')) {
            enhancedMessage += '\n\nThis might be due to browser security restrictions. Try hosting the app on a web server.';
        }
        
        errorMessage.textContent = enhancedMessage;
        errorState.style.display = 'block';
        
        // Add animation
        errorState.style.opacity = '0';
        errorState.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            errorState.style.transition = 'all 0.5s ease';
            errorState.style.opacity = '1';
            errorState.style.transform = 'translateY(0)';
        }, 100);
    }

    hideError() {
        document.getElementById('errorState').style.display = 'none';
    }

    handleSearchInput(value) {
        if (value.length < 2) return;
        
        const suggestions = this.popularCities.filter(city => 
            city.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 5);
        
        this.showSuggestions(suggestions);
    }

    showSearchSuggestions() {
        const suggestions = this.popularCities.slice(0, 8);
        this.showSuggestions(suggestions);
    }

    showSuggestions(suggestions) {
        let suggestionsContainer = document.getElementById('suggestionsContainer');
        
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.id = 'suggestionsContainer';
            suggestionsContainer.className = 'suggestions-container';
            document.querySelector('.search-container').appendChild(suggestionsContainer);
        }

        suggestionsContainer.innerHTML = suggestions.map(city => 
            `<div class="suggestion-item" data-city="${city}">${city}</div>`
        ).join('');

        // Add click events to suggestions
        suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('cityInput').value = item.dataset.city;
                this.searchWeather();
                this.hideSearchSuggestions();
            });
        });

        suggestionsContainer.style.display = 'block';
    }

    hideSearchSuggestions() {
        const suggestionsContainer = document.getElementById('suggestionsContainer');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }
}

// Global function for retry button
function retryWeather() {
    const cityInput = document.getElementById('cityInput');
    const city = cityInput.value.trim();
    
    if (city) {
        weatherApp.getWeatherByCity(city);
    } else {
        weatherApp.getCurrentLocationWeather();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.weatherApp = new WeatherApp();
        console.log('WeatherCast app initialized successfully');
    } catch (error) {
        console.error('Failed to initialize WeatherCast app:', error);
        // Show a basic error message to the user
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h1>WeatherCast</h1>
                <p>Sorry, there was an error loading the weather app.</p>
                <p>Please refresh the page and try again.</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
    }
});

// Add some interactive 3D animations
document.addEventListener('DOMContentLoaded', () => {
    const flat = true; // enforce flat theme interactions

    // Animate feature cards on scroll (flat: simple fade/translate)
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(24px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
        observer.observe(card);
    });

    // Disable parallax and particle motion in flat theme
    if (!flat) {
        window.addEventListener('scroll', () => {});
    }

    // Disable typing 3D wobble; keep plain text
    // (No-op for flat theme)

    // Disable 3D mouse tracking/tilt in flat theme
    if (!flat) {
        document.addEventListener('mousemove', () => {});
    }

    // Disable 3D hover transforms on buttons in flat theme
    if (!flat) {
        const interactiveElements = document.querySelectorAll('.search-btn, .location-btn, .retry-btn');
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {});
            element.addEventListener('mouseleave', () => {});
        });
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('cityInput').focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        document.getElementById('cityInput').value = '';
        document.getElementById('cityInput').blur();
    }
});

// Add service worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}