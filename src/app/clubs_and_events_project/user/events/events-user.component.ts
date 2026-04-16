import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.model';
import { AuthService } from '../../../services/auth.service';

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
    selectedCategory: string = 'all';
    categories: string[] = ['all', 'Workshop', 'Seminar', 'Conference', 'Competition', 'Other'];
    
    isLoading: boolean = false;
    error: string | null = null;
    user: any = null;

    // Registration Modal State
    showRegistrationModal: boolean = false;
    selectedEventForRegistration: Event | null = null;
    registrationSuccess: boolean = false;
    registrationError: string | null = null;
    
    registrationForm: any = {
        userName: '',
        userEmail: '',
        gender: '',
        level: '',
        discoverySource: '',
        paymentMethod: '',
        reason: '',
        hobbies: '',
        specialty: '',
        age: null,
        participationMode: 'PRESENTIAL',
        seatNumber: ''
    };

    // Seat Modal State
    showSeatModal: boolean = false;
    selectedSeat: string | null = null;
    rows: string[] = ['A', 'B', 'C', 'D', 'E'];
    cols: number[] = [1, 2, 3, 4, 5, 6, 7, 8];
    reservedSeats: string[] = ['A1', 'B5', 'C3']; // Demo data

    constructor(
        private eventService: EventService,
        private router: Router,
        private authService: AuthService,
    ) { }

    ngOnInit(): void {
        this.user = this.authService.getUser();
        if (this.user) {
            this.registrationForm.userName = `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim();
            this.registrationForm.userEmail = this.user.email;
        }
        this.loadEvents();
    }

    loadEvents(): void {
        this.isLoading = true;
        this.error = null;
        this.eventService.getEvents().subscribe({
            next: (data) => {
                this.events = data;
                this.applyFilters();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading events:', err);
                this.error = 'Failed to load events. Please check your connection.';
                this.isLoading = false;
            }
        });
    }

    applyFilters(): void {
        this.filteredEvents = this.events.filter(event => {
            const title = event.Title || (event as any).title || '';
            const manifesto = event.Manifesto || (event as any).description || '';
            const type = event.Type || (event as any).type || '';
            
            const matchesSearch = title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                manifesto.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesCategory = this.selectedCategory === 'all' || type === this.selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }

    onSearch(): void {
        this.applyFilters();
    }

    filterByCategory(category: string): void {
        this.selectedCategory = category;
        this.applyFilters();
    }

    isRegistered(event: Event): boolean {
        // Implement logic to check if user is already registered
        // For now, checks a local storage or specific field if available
        return false;
    }

    register(event: Event): void {
        if (!this.user) {
            alert('Please login to register for events.');
            return;
        }
        this.selectedEventForRegistration = event;
        this.showRegistrationModal = true;
        this.registrationSuccess = false;
        this.isWaitlisted = false;
        this.registrationError = null;
    }

    isWaitlisted: boolean = false;

    closeRegistrationModal(): void {
        this.showRegistrationModal = false;
        this.selectedEventForRegistration = null;
        this.isWaitlisted = false;
    }

    submitRegistration(): void {
        if (!this.selectedEventForRegistration) return;
        
        const eventId = this.selectedEventForRegistration.ID_Event || (this.selectedEventForRegistration as any).id;
        this.registrationError = null;
        
        this.eventService.registerForEvent(eventId, this.registrationForm).subscribe({
            next: (res: any) => {
                const status = (res.status || res.Status || 'CONFIRMED').toString().toUpperCase();
                this.isWaitlisted = (status === 'WAITLISTED');
                this.registrationSuccess = true;
                
                setTimeout(() => {
                    this.closeRegistrationModal();
                    this.loadEvents();
                }, 10000); // 10 seconds to let them read the waitlist message
            },
            error: (err) => {
                this.registrationError = err.error?.message || 'Registration failed. Please try again.';
            }
        });
    }

    // Seat Logic
    openSeatModal(): void {
        this.showSeatModal = true;
        this.selectedSeat = this.registrationForm.seatNumber;
    }

    closeSeatModal(): void {
        this.showSeatModal = false;
    }

    selectSeat(seatCode: string): void {
        if (this.reservedSeats.includes(seatCode)) return;
        this.selectedSeat = seatCode;
    }

    confirmSeat(): void {
        if (this.selectedSeat) {
            this.registrationForm.seatNumber = this.selectedSeat;
            this.closeSeatModal();
        }
    }

    getSeatClasses(row: string, col: number): string {
        const seatCode = row + col;
        const base = "w-6 h-6 rounded-md flex items-center justify-center transition-all ";
        
        if (this.reservedSeats.includes(seatCode)) {
            return base + "bg-red-200 text-red-500 cursor-not-allowed";
        }
        
        if (this.selectedSeat === seatCode) {
            return base + "bg-[#2D5757] text-[#F7EDE2] shadow-lg scale-110";
        }
        
        return base + "bg-white border border-[#2D5757]/10 text-[#2D5757]/20 hover:border-[#2D5757]/30 hover:bg-[#2D5757]/5";
    }

    viewDetails(event: Event): void {
        const id = event.ID_Event || (event as any).id;
        this.router.navigate(['/frontoffice/events', id]);
    }

    goBack(): void {
        this.router.navigate(['/frontoffice']);
    }
}
