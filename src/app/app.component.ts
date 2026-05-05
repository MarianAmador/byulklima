import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService, WeatherData, ForecastData } from './services/weather.service';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { WeatherCardComponent } from './components/weather-card/weather-card.component';
import { ForecastGridComponent } from './components/forecast-grid/forecast-grid.component';
import { RecentSearchesComponent } from './components/recent-searches/recent-searches.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, WeatherCardComponent, ForecastGridComponent, RecentSearchesComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  weather: WeatherData | null = null;
  forecast: ForecastData | null = null;
  loading = false;
  error = '';
  recentSearches: string[] = [];

  constructor(private weatherService: WeatherService) {}

  ngOnInit() {
    this.recentSearches = this.weatherService.getRecentSearches();
  }

  onSearchByCoords(event: {lat: number, lon: number, label: string}) {
    this.loading = true;
    this.error = '';
    this.weather = null;
    this.forecast = null;

    forkJoin({
      weather: this.weatherService.getCurrentWeatherByCoords(event.lat, event.lon),
      forecast: this.weatherService.getForecastByCoords(event.lat, event.lon)
    }).subscribe({
      next: ({ weather, forecast }) => {
        this.weather = weather;
        this.forecast = forecast;
        this.loading = false;
        this.weatherService.addRecentSearch(event.label);
        this.recentSearches = this.weatherService.getRecentSearches();
      },
      error: (msg: string) => {
        this.error = msg;
        this.loading = false;
      }
    });
  }

  onSearch(city: string) {
    this.loading = true;
    this.error = '';
    this.weather = null;
    this.forecast = null;

    forkJoin({
      weather: this.weatherService.getCurrentWeather(city),
      forecast: this.weatherService.getForecast(city)
    }).subscribe({
      next: ({ weather, forecast }) => {
        this.weather = weather;
        this.forecast = forecast;
        this.loading = false;
        this.weatherService.addRecentSearch(weather.name);
        this.recentSearches = this.weatherService.getRecentSearches();
      },
      error: (msg: string) => {
        this.error = msg;
        this.loading = false;
      }
    });
  }

  removeRecent(city: string) {
    this.weatherService.removeRecentSearch(city);
    this.recentSearches = this.weatherService.getRecentSearches();
  }
}