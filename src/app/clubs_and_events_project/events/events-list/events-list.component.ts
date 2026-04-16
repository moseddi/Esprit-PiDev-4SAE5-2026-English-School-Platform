import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EventService } from '../../services/event.service';
import { Event as ClubEvent } from '../../models/event.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.css']
})
export class EventsListComponent implements OnInit {
  events: ClubEvent[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private eventService: EventService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.isLoading = true;
    this.error = null;

    this.eventService.getEvents().subscribe({
      next: (events) => {
        if (Array.isArray(events)) {
          this.events = events;
        } else {
          this.error = 'Invalid data format received from server';
        }
        this.isLoading = false;
      },
      error: (error) => {
        if (error?.status === 0) {
          this.error = 'Cannot connect to backend server. Please check if the server is running on http://localhost:7071';
        } else {
          this.error = `Failed to load events: ${error?.message || 'Unknown error'}`;
        }
        this.isLoading = false;
      }
    });
  }

  createEvent() {
    this.router.navigate(['/admin-clubs-events/events/create']);
  }

  editEvent(event: ClubEvent) {
    const id = event.ID_Event || event.id;
    this.router.navigate(['/admin-clubs-events/events', id, 'edit']);
  }

  async deleteEvent(event: ClubEvent) {
    const id = event.ID_Event || event.id;
    const confirmed = await this.notificationService.confirm(`Are you sure you want to authorize the removal of "${event.Title || (event as any).title}"?`);
    if (confirmed) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          this.notificationService.success('Event deleted successfully!');
          this.loadEvents();
        },
        error: (error) => {
          this.notificationService.error('Failed to delete event: ' + (error?.message || 'Unknown error'));
        }
      });
    }
  }

  viewEventDetails(event: ClubEvent) {
    const id = event.ID_Event || event.id;
    this.router.navigate(['/admin-clubs-events/events', id]);
  }

  viewStats(event: ClubEvent) {
    const id = event.ID_Event || event.id;
    this.router.navigate(['/admin-clubs-events/event-stats', id]);
  }

  viewWaitlist(event: ClubEvent) {
    const id = event.ID_Event || event.id;
    this.router.navigate(['/admin-clubs-events/event-waitlist', id]);
  }

  viewGlobalStats() {
    this.router.navigate(['/admin-clubs-events/event-stats', 'global']);
  }

  navigateToDashboard() {
    this.router.navigate(['/admin-clubs-events']);
  }
}
