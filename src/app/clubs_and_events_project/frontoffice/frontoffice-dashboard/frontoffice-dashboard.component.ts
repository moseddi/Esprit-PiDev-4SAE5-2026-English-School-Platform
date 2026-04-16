import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-frontoffice-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './frontoffice-dashboard.component.html',
  styleUrls: ['./frontoffice-dashboard.component.css']
})
export class FrontofficeDashboardComponent {
  isAdmin = false;
  userName = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) { 
    const user = this.authService.getUser();
    this.isAdmin = user?.role === 'ADMIN';
    this.userName = user?.firstName || user?.email || 'User';
  }

  navigateToClubs() {
    this.router.navigate(['/frontoffice/clubs']);
  }

  navigateToEvents() {
    this.router.navigate(['/frontoffice/events']);
  }

  navigateToSpaces() {
    this.router.navigate(['/frontoffice/spaces']);
  }

  navigateToBackoffice() {
    this.router.navigate(['/admin-clubs-events']);
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }
}
