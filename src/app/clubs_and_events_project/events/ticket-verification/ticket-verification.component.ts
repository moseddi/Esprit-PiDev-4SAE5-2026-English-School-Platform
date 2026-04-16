import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventService } from '../../services/event.service';
import { CommonModule } from '@angular/common';

declare var confetti: any;

@Component({
  selector: 'app-ticket-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-verification.component.html',
  styleUrls: ['./ticket-verification.component.css']
})
export class TicketVerificationComponent implements OnInit {
  registration: any;
  event: any;
  loading = true;
  error: string | null = null;
  verified = false;
  isCheckingIn = false;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.verifyTicket(Number(id));
    } else {
      this.error = 'ID de ticket manquant';
      this.loading = false;
    }
  }

  verifyTicket(id: number): void {
    this.eventService.getRegistrationById(id).subscribe({
      next: (reg) => {
        this.registration = reg;
        this.fetchEventDetails(reg.eventId);
        this.verified = true;
        this.triggerConfetti();
      },
      error: (err) => {
        this.error = 'Ticket invalide ou introuvable';
        this.loading = false;
      }
    });
  }

  fetchEventDetails(eventId: number): void {
    this.eventService.getEventById(eventId).subscribe({
      next: (event) => {
        this.event = event;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Détails de l\'événement introuvables';
        this.loading = false;
      }
    });
  }

  triggerConfetti() {
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2d5757', '#4ade80', '#ffffff']
      });
    }
  }

  confirmAttendance(): void {
    this.isCheckingIn = true;
    // Simulation d'un appel API pour confirmer l'entrée
    setTimeout(() => {
      this.registration.attended = true;
      this.isCheckingIn = false;
    }, 1500);
  }
}
