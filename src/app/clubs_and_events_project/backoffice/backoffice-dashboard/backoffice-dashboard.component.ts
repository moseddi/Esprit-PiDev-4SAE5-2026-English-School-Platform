import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WebsocketService, BudgetStats } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-backoffice-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './backoffice-dashboard.component.html',
  styleUrls: ['./backoffice-dashboard.component.css']
})
export class BackofficeDashboardComponent implements OnInit, OnDestroy {
  public currentStats: BudgetStats = { totalEstimatedCost: 0, activeEventsCount: 0 };
  private statsSub!: Subscription;

  constructor(private router: Router, private wsService: WebsocketService) { }

  ngOnInit(): void {
    this.statsSub = this.wsService.budgetStats$.subscribe(
      (data: BudgetStats) => {
        this.currentStats = data;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.statsSub) {
      this.statsSub.unsubscribe();
    }
  }

  navigateToClubs() {
    this.router.navigate(['/admin-clubs-events/clubs']);
  }

  navigateToEvents() {
    this.router.navigate(['/admin-clubs-events/events']);
  }

  navigateToSpaces() {
    this.router.navigate(['/admin-clubs-events/spaces']);
  }

  navigateToFrontoffice() {
    this.router.navigate(['/frontoffice']);
  }

  navigateToBackofficeAdmin() {
    this.router.navigate(['/backoffice/admin']);
  }
}
