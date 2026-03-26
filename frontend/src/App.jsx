import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Loader2, Cloud, Droplets, Wind, Thermometer } from 'lucide-react';

const API_BASE_URL = '/api/weather';

function App() {
  const [city, setCity] = useState('London');
  const [searchInput, setSearchInput] = useState('London');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeather(city);
  }, [city]);

  const fetchWeather = async (cityName) => {
    setLoading(true);
    setError(null);
    try {
      // In development (Docker Compose) we might hit standard localhost:8000 directly
      // but through k8s ingress it goes via /api routing
      // If we don't have Vite proxy set up, let's use relative path assuming ingress,
      // and for local dev we can configure a proxy or use env vars. Let's use relative for now,
      // and rely on Nginx / Ingress to route.
      const response = await axios.get(`${API_BASE_URL}/${cityName}`);
      setWeatherData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setCity(searchInput.trim());
    }
  };

  const formatForecastData = (forecast) => {
    if (!forecast || !forecast.list) return [];
    return forecast.list.slice(0, 8).map(item => ({
      time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(item.main.temp),
      feels_like: Math.round(item.main.feels_like)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header and Search */}
        <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="p-3 bg-blue-500 rounded-xl text-white shadow-md shadow-blue-500/30">
              <Cloud size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Weather Dashboard</h1>
          </div>
          
          <form onSubmit={handleSearch} className="w-full md:w-auto flex">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search city..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 transition-all font-medium text-gray-700"
              />
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            </div>
            <button 
              type="submit" 
              className="ml-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20"
              disabled={loading}
            >
              Search
            </button>
          </form>
        </header>

        {loading && (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="animate-spin text-blue-500" size={56} />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 flex items-center shadow-sm">
            <span className="font-bold mr-2">Error:</span> {error}
          </div>
        )}

        {weatherData && !loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Current Weather Card */}
            <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 p-8 opacity-20">
                <Cloud size={200} />
              </div>
              <div className="absolute -bottom-10 -left-10 p-8 opacity-10">
                <Wind size={150} />
              </div>
              
              <div className="relative z-10 w-full h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-1 tracking-tight">{weatherData.current.name}, {weatherData.current.sys.country}</h2>
                  <p className="text-blue-100 capitalize text-xl font-medium">{weatherData.current.weather[0].description}</p>
                </div>
                
                <div className="my-10 text-center">
                  <div className="text-8xl font-black drop-shadow-lg tracking-tighter">
                    {Math.round(weatherData.current.main.temp)}°
                  </div>
                  <p className="text-blue-100 text-xl mt-3 font-medium">
                    Feels like {Math.round(weatherData.current.main.feels_like)}°
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-6 mt-auto border-t border-white/20">
                  <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <Wind size={24} className="text-blue-200" />
                    <span className="font-semibold">{weatherData.current.wind.speed} m/s</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <Droplets size={24} className="text-blue-200" />
                    <span className="font-semibold">{weatherData.current.main.humidity}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Highlight Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 duration-300">
                  <div className="p-3 bg-orange-50 text-orange-500 rounded-full mb-3">
                    <Thermometer size={24} />
                  </div>
                  <span className="text-gray-500 text-sm font-medium mb-1">Max Temp</span>
                  <span className="text-2xl font-bold text-gray-800">{Math.round(weatherData.current.main.temp_max)}°</span>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 duration-300">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-full mb-3">
                    <Thermometer size={24} />
                  </div>
                  <span className="text-gray-500 text-sm font-medium mb-1">Min Temp</span>
                  <span className="text-2xl font-bold text-gray-800">{Math.round(weatherData.current.main.temp_min)}°</span>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 duration-300">
                  <div className="p-3 bg-teal-50 text-teal-500 rounded-full mb-3">
                    <Wind size={24} />
                  </div>
                  <span className="text-gray-500 text-sm font-medium mb-1">Wind Gust</span>
                  <span className="text-2xl font-bold text-gray-800">{weatherData.current.wind.gust ? weatherData.current.wind.gust : '-'} m/s</span>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 duration-300">
                  <div className="p-3 bg-gray-100 text-gray-500 rounded-full mb-3">
                    <Cloud size={24} />
                  </div>
                  <span className="text-gray-500 text-sm font-medium mb-1">Cloudiness</span>
                  <span className="text-2xl font-bold text-gray-800">{weatherData.current.clouds.all}%</span>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center">
                  <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
                  24-Hour Temperature Forecast
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatForecastData(weatherData.forecast)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 13, fill: '#6B7280', fontWeight: 500}}
                        dy={15}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 13, fill: '#6B7280', fontWeight: 500}}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                        itemStyle={{fontWeight: 600}}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="temp" 
                        stroke="#3B82F6" 
                        strokeWidth={4}
                        dot={{ r: 5, strokeWidth: 2, fill: '#fff' }} 
                        activeDot={{ r: 8, strokeWidth: 0 }}
                        name="Temperature (°C)"
                        animationDuration={1500}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="feels_like" 
                        stroke="#93C5FD" 
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Feels Like (°C)"
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
