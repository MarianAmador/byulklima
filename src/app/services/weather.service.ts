import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface WeatherData {
  name: string;
  timezone: number;
  sys: { country: string; sunrise: number; sunset: number };
  main: { temp: number; feels_like: number; humidity: number; temp_min: number; temp_max: number; pressure: number };
  weather: { id: number; main: string; description: string; icon: string }[];
  wind: { speed: number };
  visibility: number;
}

export interface ForecastData {
  list: {
    dt: number;
    main: { temp: number; feels_like: number; humidity: number; temp_min: number; temp_max: number };
    weather: { id: number; main: string; description: string; icon: string }[];
    wind: { speed: number };
    dt_txt: string;
  }[];
  city: { name: string; country: string };
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private apiUrl = 'https://api.openweathermap.org/data/2.5';
  private geoUrl = 'https://api.openweathermap.org/geo/1.0';
  private apiKey = environment.openWeatherApiKey;
  private cache = new Map<string, { data: any; time: number }>();
  private CACHE_TTL = 5 * 60 * 1000;
  private recentSearchesKey = 'byulklima_recent';

  constructor(private http: HttpClient) {}

  searchCities(query: string): Observable<any[]> {
    return this.http.get<any[]>(
      this.geoUrl + '/direct?q=' + encodeURIComponent(query) + '&limit=6&appid=' + this.apiKey
    ).pipe(
      catchError(() => of([]))
    );
  }

  getCurrentWeather(city: string): Observable<WeatherData> {
    const cacheKey = 'weather_' + city.toLowerCase();
    const cached = this.getFromCache(cacheKey);
    if (cached) return of(cached);
    return this.http.get<WeatherData>(
      this.apiUrl + '/weather?q=' + encodeURIComponent(city) + '&appid=' + this.apiKey
    ).pipe(
      tap(data => this.setCache(cacheKey, data)),
      catchError(err => throwError(() => this.parseError(err)))
    );
  }

  getCurrentWeatherByCoords(lat: number, lon: number): Observable<WeatherData> {
    const cacheKey = 'weather_' + lat + '_' + lon;
    const cached = this.getFromCache(cacheKey);
    if (cached) return of(cached);
    return this.http.get<WeatherData>(
      this.apiUrl + '/weather?lat=' + lat + '&lon=' + lon + '&appid=' + this.apiKey
    ).pipe(
      tap(data => this.setCache(cacheKey, data)),
      catchError(err => throwError(() => this.parseError(err)))
    );
  }

  getForecast(city: string): Observable<ForecastData> {
    const cacheKey = 'forecast_' + city.toLowerCase();
    const cached = this.getFromCache(cacheKey);
    if (cached) return of(cached);
    return this.http.get<ForecastData>(
      this.apiUrl + '/forecast?q=' + encodeURIComponent(city) + '&appid=' + this.apiKey + '&cnt=40'
    ).pipe(
      tap(data => this.setCache(cacheKey, data)),
      catchError(err => throwError(() => this.parseError(err)))
    );
  }

  getForecastByCoords(lat: number, lon: number): Observable<ForecastData> {
    const cacheKey = 'forecast_' + lat + '_' + lon;
    const cached = this.getFromCache(cacheKey);
    if (cached) return of(cached);
    return this.http.get<ForecastData>(
      this.apiUrl + '/forecast?lat=' + lat + '&lon=' + lon + '&appid=' + this.apiKey + '&cnt=40'
    ).pipe(
      tap(data => this.setCache(cacheKey, data)),
      catchError(err => throwError(() => this.parseError(err)))
    );
  }

  private getFromCache(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.time > this.CACHE_TTL) { this.cache.delete(key); return null; }
    return entry.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, time: Date.now() });
  }

  private parseError(err: any): string {
    if (err.status === 404) return 'Ciudad no encontrada. Verifica el nombre e intenta de nuevo.';
    if (err.status === 401) return 'API key inválida.';
    if (err.status === 0) return 'Sin conexión a internet. Verifica tu red.';
    return 'Error inesperado. Intenta más tarde.';
  }

  getRecentSearches(): string[] {
    try { return JSON.parse(localStorage.getItem(this.recentSearchesKey) || '[]'); }
    catch { return []; }
  }

  addRecentSearch(city: string): void {
    const recent = this.getRecentSearches().filter(c => c.toLowerCase() !== city.toLowerCase());
    recent.unshift(city);
    localStorage.setItem(this.recentSearchesKey, JSON.stringify(recent.slice(0, 5)));
  }

  removeRecentSearch(city: string): void {
    const recent = this.getRecentSearches().filter(c => c.toLowerCase() !== city.toLowerCase());
    localStorage.setItem(this.recentSearchesKey, JSON.stringify(recent));
  }
}