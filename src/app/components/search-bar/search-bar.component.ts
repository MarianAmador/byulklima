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
  selectedIndex = -1;
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
      this.selectedIndex = -1;
      this.showSuggestions = this.suggestions.length > 0;
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  onInput() { this.inputSubject.next(this.query); }

  onSearch() {
    if (this.query.trim()) {
      this.search.emit(this.query.trim());
      this.showSuggestions = false;
      this.selectedIndex = -1;
    }
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
      return;
    }
    if (e.key === 'Enter') {
      if (this.selectedIndex >= 0 && this.suggestions[this.selectedIndex]) {
        this.selectCity(this.suggestions[this.selectedIndex]);
      } else {
        this.onSearch();
      }
      return;
    }
    if (e.key === 'Escape') {
      this.showSuggestions = false;
      this.selectedIndex = -1;
    }
  }

  selectCity(city: CitySuggestion) {
    const label = city.name + ', ' + (city.state ? city.state + ', ' : '') + city.country;
    this.query = label;
    this.showSuggestions = false;
    this.selectedIndex = -1;
    this.searchByCoords.emit({ lat: city.lat, lon: city.lon, label });
  }

  hideSuggestions() {
    setTimeout(() => {
      this.showSuggestions = false;
      this.selectedIndex = -1;
    }, 150);
  }

  private getCountryName(code: string): string {
    try {
      return new Intl.DisplayNames(['es'], { type: 'region' }).of(code) || code;
    } catch { return code; }
  }
}