import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../../services/auth.service';
import { Event } from '../../models/event.model';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.css'
})
export class EventDetailsComponent {
  event: Event | any = null;
  isRegistered = false;
  registrationStatus: string = '';
  confirmedCount = 0;
  isRegistering = false;
  user: any = null;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private eventService: EventService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.user = this.authService.getUser();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadEvent(id);
      this.loadStats(id);
      if (this.user) {
        this.checkRegistration(id);
      }
    }
  }

  loadEvent(id: number) {
    this.eventService.getEventById(id).subscribe({
      next: (data) => {
        this.event = data;
        if (!this.event.title && this.event.Title) this.event.title = this.event.Title;
      },
      error: (err) => console.error('Error loading event:', err)
    });
  }

  loadStats(id: number) {
    this.eventService.getEventStats(id).subscribe({
      next: (stats) => {
        this.confirmedCount = stats.confirmedCount || 0;
      },
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  checkRegistration(eventId: number) {
    if (!eventId || !this.user?.id) return;
    this.eventService.getUserRegistrations(this.user.id).subscribe({
      next: (registrations) => {
        const reg = registrations.find(r => (r.eventId === eventId || (r as any).EventId === eventId));
        if (reg) {
          this.isRegistered = true;
          this.registrationStatus = (reg as any).Status || reg.status || 'CONFIRMED';
        }
      },
      error: (err) => console.error('Error checking registration:', err)
    });
  }

  getEventId(): number {
    if (!this.event) return 0;
    return Number(this.event.ID_Event || this.event.id || 0);
  }

  isFull(): boolean {
    if (!this.event) return false;
    return this.confirmedCount >= (this.event.MaxParticipants || this.event.maxParticipants || 0);
  }

  registerNow() {
    if (!this.user) {
      alert('Please login to register for events.');
      return;
    }

    if (this.isRegistered) return;

    this.isRegistering = true;
    const eventId = this.getEventId();
    if (!eventId) {
      this.isRegistering = false;
      alert('Error: Event ID not found.');
      return;
    }

    const registrationData = {
      userName: `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() || this.user.email,
      userEmail: this.user.email,
      userId: this.user.id
    };

    this.eventService.registerForEvent(eventId, registrationData).subscribe({
      next: (res: any) => {
        console.log('Registration Response:', res);
        this.isRegistering = false;
        this.isRegistered = true;
        
        // Robust status extraction
        const serverStatus = (res.status || res.Status || 'CONFIRMED').toString().toUpperCase();
        this.registrationStatus = serverStatus;
        
        if (serverStatus === 'WAITLISTED') {
          alert('Event capacity has been reached! Your application has been successfully submitted to the WAITLIST. You will be automatically notified and promoted if a spot becomes available.');
        } else {
          alert('Registration successful! Your place is confirmed. Please check your email for your QR code ticket.');
        }
        this.loadStats(eventId);
      },
      error: (err) => {
        this.isRegistering = false;
        alert(err.error?.error || 'Registration failed. Please try again.');
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
