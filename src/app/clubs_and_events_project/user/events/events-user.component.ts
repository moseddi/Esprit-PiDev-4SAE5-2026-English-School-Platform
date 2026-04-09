import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.model';

@Component({
    selector: 'app-events-user',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './events-user.component.html',
    styleUrls: ['./events-user.component.css']
})
export class EventsUserComponent implements OnInit {
    events: Event[] = [];
    filteredEvents: Event[] = [];
    searchTerm: string = '';
    isLoading = true;
    error: string | null = null;

    // Track which events the user has registered for (in-session)
    registeredEventIds = new Set<number>();

    // Registration Modal State
    showRegistrationModal = false;
    selectedEventForRegistration: Event | null = null;
    registrationForm = {
        userName: '',
        userEmail: '',
        discoverySource: '',
        gender: '',
        reason: '',
        level: '',
        hobbies: '',
        paymentMethod: '',
        age: null,
        specialty: '',
        participationMode: 'PRESENTIAL'
    };
    registrationError: string | null = null;
    registrationSuccess = false;

    constructor(
        private eventService: EventService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadEvents();
    }

    loadEvents() {
        this.isLoading = true;
        this.error = null;

        console.log('EventsUserComponent: Loading events...');
        this.eventService.getEvents().subscribe({
            next: (events) => {
                console.log('EventsUserComponent: Events loaded successfully:', events);
                this.events = Array.isArray(events) ? events : [];
                this.applyFilters();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('EventsUserComponent: Error loading events:', error);
                this.error = 'Unable to load events. Please check if the service is running.';
                this.isLoading = false;
            }
        });
    }

    onSearch() {
        this.applyFilters();
    }

    applyFilters() {
        if (!this.searchTerm || !this.searchTerm.trim()) {
            this.filteredEvents = [...this.events];
            return;
        }

        const term = this.searchTerm.toLowerCase().trim();
        this.filteredEvents = this.events.filter(event =>
            (event.Title && event.Title.toLowerCase().includes(term)) ||
            (this.getAnyTitle(event).toLowerCase().includes(term))
        );
    }

    private getAnyTitle(event: any): string {
        return event.Title || event.title || '';
    }

    openRegistrationModal(event: Event) {
        this.selectedEventForRegistration = event;
        this.showRegistrationModal = true;
        this.registrationSuccess = false;
        this.registrationError = null;
        this.registrationForm = {
            userName: '',
            userEmail: '',
            discoverySource: '',
            gender: '',
            reason: '',
            level: '',
            hobbies: '',
            paymentMethod: '',
            age: null,
            specialty: '',
            participationMode: 'PRESENTIAL'
        };
    }

    closeRegistrationModal() {
        this.showRegistrationModal = false;
        this.selectedEventForRegistration = null;
    }

    submitRegistration() {
        if (!this.selectedEventForRegistration || !this.registrationForm.userName || !this.registrationForm.userEmail) {
            this.registrationError = 'Please fill all required fields';
            return;
        }

        const eventId = this.selectedEventForRegistration.ID_Event || this.selectedEventForRegistration.id;

        this.eventService.registerForEvent(eventId, this.registrationForm).subscribe({
            next: (response) => {
                this.registrationSuccess = true;
                this.registeredEventIds.add(eventId);
                setTimeout(() => this.closeRegistrationModal(), 2000);
            },
            error: (error) => {
                this.registrationError = error.error?.error || 'Registration failed due to a server error';
            }
        });
    }

    register(event: Event) {
        this.openRegistrationModal(event);
    }

    isRegistered(event: Event): boolean {
        return this.registeredEventIds.has(event.ID_Event || event.id);
    }

    goBack() {
        this.router.navigate(['/frontoffice']);
    }
}
