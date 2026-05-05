import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recent-searches',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-searches.component.html',
  styleUrls: ['./recent-searches.component.scss']
})
export class RecentSearchesComponent {
  @Input() searches: string[] = [];
  @Output() select = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();
}
