import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-event-waitlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-waitlist.component.html',
  styleUrls: ['./event-waitlist.component.css']
})
export class EventWaitlistComponent implements OnInit {
  eventId: number = 0;
  waitlistedParticipants: any[] = [];
  isLoading = true;
  eventTitle: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.eventId) {
      this.loadEventDetails();
      this.loadWaitlist();
    }
  }

  loadEventDetails() {
    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        this.eventTitle = event.Title || (event as any).title || 'Event Waitlist';
      }
    });
  }

  loadWaitlist() {
    this.isLoading = true;
    this.eventService.getWaitlist(this.eventId).subscribe({
      next: (list) => {
        this.waitlistedParticipants = list;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading waitlist:', err);
        this.isLoading = false;
      }
    });
  }

  promoteParticipant(regId: number, name: string) {
    this.notificationService.confirm(`Are you sure you want to promote ${name} to Confirmed status?`).then(confirmed => {
      if (confirmed) {
        this.eventService.promoteFromWaitlist(regId).subscribe({
          next: () => {
            this.notificationService.success(`${name} has been promoted and notified.`);
            this.loadWaitlist();
          },
          error: (err) => {
            this.notificationService.error('Promotion failed: ' + (err.error?.error || 'Unknown error'));
          }
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin-clubs-events/events']);
  }
}
