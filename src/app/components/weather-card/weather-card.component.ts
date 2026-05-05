import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherData } from '../../services/weather.service';
import { KelvinToCelsiusPipe } from '../../pipes/kelvin-to-celsius.pipe';

@Component({
  selector: 'app-weather-card',
  standalone: true,
  imports: [CommonModule, KelvinToCelsiusPipe],
  templateUrl: './weather-card.component.html',
  styleUrls: ['./weather-card.component.scss']
})
export class WeatherCardComponent implements OnInit, OnDestroy {
  @Input() weather!: WeatherData;

  localTime = '';
  private timer: any;

  ngOnInit() {
    this.updateTime();
    this.timer = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  private updateTime() {
    const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000;
    const cityMs = utcMs + this.weather.timezone * 1000;
    const cityDate = new Date(cityMs);
    this.localTime = cityDate.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  get iconUrl(): string {
    return 'https://openweathermap.org/img/wn/' + this.weather.weather[0].icon + '@2x.png';
  }

  get windKmh(): string {
    return (this.weather.wind.speed * 3.6).toFixed(1);
  }

  get visibilityKm(): string {
    return (this.weather.visibility / 1000).toFixed(1);
  }

  formatTime(unix: number): string {
    return new Date(unix * 1000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  get countryName(): string {
    try {
      return new Intl.DisplayNames(['es'], { type: 'region' }).of(this.weather.sys.country) || this.weather.sys.country;
    } catch { return this.weather.sys.country; }
  }
}