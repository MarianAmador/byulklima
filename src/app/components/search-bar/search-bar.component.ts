import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { WeatherService } from '../../services/weather.service';

export interface CitySuggestion {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() recentSearches: string[] = [];
  @Output() search = new EventEmitter<string>();
  @Output() searchByCoords = new EventEmitter<{lat: number, lon: number, label: string}>();

  query = '';
  showSuggestions = false;
  suggestions: CitySuggestion[] = [];
  private inputSubject = new Subject<string>();
  private sub!: Subscription;

  constructor(private weatherService: WeatherService) {}

  ngOnInit() {
    this.sub = this.inputSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(val => {
        if (val.length < 2) {
          this.suggestions = [];
          this.showSuggestions = false;
          return [];
        }
        return this.weatherService.searchCities(val);
      })
    ).subscribe(results => {
      this.suggestions = results.map((r: any) => ({
        name: r.name,
        country: this.getCountryName(r.country),
        state: r.state,
        lat: r.lat,
        lon: r.lon
      }));
      this.showSuggestions = this.suggestions.length > 0;
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  onInput() { this.inputSubject.next(this.query); }

  onSearch() {
    if (this.query.trim()) {
      this.search.emit(this.query.trim());
      this.showSuggestions = false;
    }
  }

  onKeyDown(e: KeyboardEvent) { if (e.key === 'Enter') this.onSearch(); }

  selectCity(city: CitySuggestion) {
    const label = city.name + ', ' + (city.state ? city.state + ', ' : '') + city.country;
    this.query = label;
    this.showSuggestions = false;
    this.searchByCoords.emit({ lat: city.lat, lon: city.lon, label });
  }

  hideSuggestions() { setTimeout(() => this.showSuggestions = false, 150); }

  private getCountryName(code: string): string {
    try {
      return new Intl.DisplayNames(['es'], { type: 'region' }).of(code) || code;
    } catch { return code; }
  }
}