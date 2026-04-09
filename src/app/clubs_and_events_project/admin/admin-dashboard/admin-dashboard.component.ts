import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WebsocketService, BudgetStats } from '../../../services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
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
    this.router.navigate(['/admin/clubs']);
  }

  navigateToEvents() {
    this.router.navigate(['/admin/events']);
  }

  navigateToSpaces() {
    this.router.navigate(['/admin/spaces']);
  }

  navigateToUserInterface() {
    this.router.navigate(['/']);
  }
}
