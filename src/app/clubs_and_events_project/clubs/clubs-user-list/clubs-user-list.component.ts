import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { timer, Subscription } from 'rxjs';
import { Club } from '../../models/club.model';
import { CategoryClub } from '../../models/enums';
import { ClubService } from '../../services/club.service';
import { JoinClubFormComponent } from '../join-club-form/join-club-form.component';

@Component({
  selector: 'app-clubs-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, JoinClubFormComponent],
  templateUrl: './clubs-user-list.component.html',
  styleUrls: ['./clubs-user-list.component.css']
})
export class ClubsUserListComponent implements OnInit, OnDestroy {
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  searchTerm: string = '';
  selectedCategory: string = 'all';
  selectedClubForJoin: { id: number; name: string } | null = null;
  showJoinForm: boolean = false;
  userRegistrations: number[] = []; // Store club IDs user has joined
  popularClubName: string = '';
  private pollingSubscription: Subscription | null = null;

  categories = [
    { value: 'all', label: 'ALL CLUBS' },
    { value: 'ACADEMY', label: 'ACADEMY' },
    { value: 'SPORTS', label: 'SPORTS' },
    { value: 'ARTS', label: 'ARTS' },
    { value: 'SOCIAL', label: 'SOCIAL' },
    { value: 'CULTURAL', label: 'CULTURAL' }
  ];

  constructor(
    private clubService: ClubService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadClubs();
    this.loadUserRegistrations();

    // Initial load from REST to show immediate state
    this.loadPopularClub();

    // Switch to WebSocket for real-time updates (replaces 30s timer)
    this.connectToPopularityWebSocket();
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  connectToPopularityWebSocket() {
    console.log('ClubsUserListComponent: Establishing WebSocket connection...');
    this.pollingSubscription = this.clubService.getPopularityWebSocket().subscribe({
      next: (name) => {
        console.log('Real-time update received:', name);
        if (name && name !== 'No registrations today') {
          if (this.popularClubName !== name) {
            this.popularClubName = name;
            this.cdr.detectChanges();
          }
        } else {
          if (this.popularClubName !== '') {
            this.popularClubName = '';
            this.cdr.detectChanges();
          }
        }
      },
      error: (err) => {
        console.warn('WebSocket failed (server might be down). Reverting to one-time REST load for demo safety.', err);
      }
    });
  }

  loadPopularClub() {
    this.clubService.getPopularClub().subscribe({
      next: (name) => {
        if (name && name !== 'No registrations today') {
          if (this.popularClubName !== name) {
            this.popularClubName = name;
            console.log('Popular club updated:', name);
            this.cdr.detectChanges();
          }
        } else {
          if (this.popularClubName !== '') {
            this.popularClubName = '';
            this.cdr.detectChanges();
          }
        }
      },
      error: (err) => console.error('Error fetching popular club:', err)
    });
  }

  loadClubs() {
    console.log('ClubsUserListComponent: Loading clubs...');
    this.clubService.getClubs().subscribe({
      next: (data) => {
        this.clubs = data || [];
        this.filteredClubs = [...this.clubs];
      },
      error: (err) => {
        console.error('ClubsUserListComponent: Error loading clubs:', err);
      }
    });
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onSearch() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.clubs];

    // Filter by Category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(club => club.Category === this.selectedCategory);
    }

    // Filter by Search Term
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(club =>
        (club.name && club.name.toLowerCase().includes(term)) ||
        (this.getAnyName(club).toLowerCase().includes(term))
      );
    }

    this.filteredClubs = filtered;
  }

  private getAnyName(club: any): string {
    return club.Name || club.name || '';
  }

  openJoinForm(club: Club) {
    this.selectedClubForJoin = { id: club.ID_Club || 0, name: club.name };
    this.showJoinForm = true;
  }

  closeJoinForm() {
    this.showJoinForm = false;
    this.selectedClubForJoin = null;
  }

  onJoinSubmit() {
    // Mock implementation - in real app, this would save to backend
    this.userRegistrations.push(this.selectedClubForJoin!.id);
    console.log('User joined club:', this.selectedClubForJoin?.name);
    this.closeJoinForm();
  }

  loadUserRegistrations() {
    const currentUserId = parseInt(localStorage.getItem('current_user_id') || '1');
    // Using simple registration check - in a real app this would call the registration service
    // But since this is a list view, we just need the user's registrations
    // For now we'll mock it if the service call is too complex for this component
    this.userRegistrations = [1, 3]; // Mocked as per other components
  }

  isUserRegistered(clubId: number): boolean {
    return this.userRegistrations.includes(clubId);
  }

  viewDetails(id: number) {
    this.router.navigate(['/admin-clubs', id]);
  }

  getCategoryLabel(category: CategoryClub): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  navigateToDashboard() {
    this.router.navigate(['/frontoffice']);
  }
}
