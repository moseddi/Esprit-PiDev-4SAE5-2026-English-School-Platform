import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ProfileCompletionComponent } from '../../profile-completion/profile-completion.component';
import { NotificationWebSocketService } from '../../assessment_project/backoffice/services/notification-websocket.service';
import { AppNotification } from '../../assessment_project/backoffice/models/notification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar-front',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink,
    ProfileCompletionComponent
  ],
  templateUrl: './navbar-front.component.html',
  styleUrls: ['./navbar-front.component.css']
})
export class NavbarFrontComponent implements OnInit, OnDestroy {
  isNavbarScrolled = false;
  isLoggedIn = false;
  userRole: string = '';
  canAccessBackoffice = false;
  user: any = {};
  showProfileModal = false;

  // Notification properties
  showNotifMenu = false;
  unreadNotifs: AppNotification[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private notifSvc: NotificationWebSocketService
  ) {}

  ngOnInit(): void {
    // Get user data from AuthService
    const user = this.authService.getUser();
    this.user = user;
    this.isLoggedIn = !!user;
    this.userRole = user?.role || '';
    this.canAccessBackoffice = this.userRole === 'ADMIN' || this.userRole === 'TUTOR';

    // Listen to job offers (career) notifications
    this.subscriptions.push(
      this.notifSvc.getCareerUpdates().subscribe({
        next: (notif) => {
          if (notif) {
            this.unreadNotifs.unshift(notif);
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isNavbarScrolled = window.scrollY > 50;
  }

  // Notification methods
  toggleNotifMenu(): void {
    this.showNotifMenu = !this.showNotifMenu;
  }

  markAllAsRead(): void {
    this.unreadNotifs = [];
    this.showNotifMenu = false;
  }

  goToOffer(notif: AppNotification): void {
    this.unreadNotifs = this.unreadNotifs.filter(n => n !== notif);
    this.showNotifMenu = false;
    this.router.navigate(['/assessment/frontoffice/recruitment']);
  }

  formatTime(timestamp: string): string {
    if (!timestamp) return 'Récemment';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return timestamp;
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timestamp;
    }
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userRole = '';
    this.canAccessBackoffice = false;
    this.user = {};
    this.showProfileModal = false;
  }

  openProfileModal(): void {
    this.showProfileModal = true;
  }

  closeModal(): void {
    this.showProfileModal = false;
  }

  onProfileUpdated(): void {
    // Refresh user data when profile is updated
    const updatedUser = this.authService.getUser();
    this.user = updatedUser;
  }
}