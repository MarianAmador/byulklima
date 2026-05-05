import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForecastData } from '../../services/weather.service';
import { KelvinToCelsiusPipe } from '../../pipes/kelvin-to-celsius.pipe';

interface DayForecast {
  date: string;
  dayName: string;
  icon: string;
  description: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
}

@Component({
  selector: 'app-forecast-grid',
  standalone: true,
  imports: [CommonModule, KelvinToCelsiusPipe],
  templateUrl: './forecast-grid.component.html',
  styleUrls: ['./forecast-grid.component.scss']
})
export class ForecastGridComponent {
  @Input() set forecast(data: ForecastData) {
    this.days = this.processForecast(data);
  }

  days: DayForecast[] = [];

  private processForecast(data: ForecastData): DayForecast[] {
    const grouped = new Map<string, any[]>();
    data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!grouped.has(date)) grouped.set(date, []);
      grouped.get(date)!.push(item);
    });

    const days: DayForecast[] = [];
    const today = new Date().toISOString().split('T')[0];

    grouped.forEach((items, date) => {
      if (date === today) return;
      const midday = items.find(i => i.dt_txt.includes('12:00')) || items[Math.floor(items.length / 2)];
      const temps = items.map(i => i.main.temp);
      days.push({
        date,
        dayName: new Date(date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }),
        icon: midday.weather[0].icon,
        description: midday.weather[0].description,
        tempMax: Math.max(...items.map(i => i.main.temp_max)),
        tempMin: Math.min(...items.map(i => i.main.temp_min)),
        humidity: Math.round(items.reduce((s, i) => s + i.main.humidity, 0) / items.length)
      });
    });

    return days.slice(0, 5);
  }

  iconUrl(icon: string): string {
    return 'https://openweathermap.org/img/wn/' + icon + '@2x.png';
  }
}
