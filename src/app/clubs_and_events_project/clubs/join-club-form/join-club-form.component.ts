import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClubService } from '../../services/club.service';
import { ClubRegistrationService } from '../../services/club-registration.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-join-club-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './join-club-form.component.html',
  styleUrls: ['./join-club-form.component.css']
})
export class JoinClubFormComponent implements OnInit {
  @Input() clubId: number = 0;
  @Input() clubName: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() joined = new EventEmitter<void>();

  joinForm: FormGroup;
  isSubmitting = false;
  clubDetails: any = null;
  user: any = null;

  constructor(
    private fb: FormBuilder,
    private clubRegistrationService: ClubRegistrationService,
    private clubService: ClubService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.user = this.authService.getUser();
    const userId = this.user?.id || 1;

    this.joinForm = this.fb.group({
      userId: [userId, Validators.required],
      status: ['Pending', Validators.required],
      fullName: [this.user ? `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() : '', [Validators.required, Validators.minLength(2)]],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s\-\(\)]+$/)]],
      yearOfStudy: ['', Validators.required],
      motivation: ['', [Validators.required, Validators.minLength(5)]],
      skills: [''],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  ngOnInit() {
    this.loadClubDetails();
  }

  loadClubDetails() {
    if (this.clubId) {
      this.clubService.getClubById(this.clubId).subscribe({
        next: (club) => {
          this.clubDetails = club;
          if (club && (club.name || (club as any).Name)) {
            this.clubName = club.name || (club as any).Name;
          }
        },
        error: (error) => console.error('Error loading club details:', error)
      });
    }
  }

  onSubmit() {
    if (this.joinForm.invalid) {
      this.notificationService.error('Please fill all required fields correctly.');
      return;
    }

    if (!this.isSubmitting) {
      this.isSubmitting = true;

      // Log current user state for debugging
      console.log('Current User Object from Auth:', this.user);
      console.log('Registering for Club ID:', this.clubId);

      const registrationData: any = {
        User_Id: Number(this.joinForm.value.userId),
        Club_Id: Number(this.clubId),
        Status: 'Pending',
        FullName: this.joinForm.value.fullName,
        Email: this.joinForm.value.email,
        Phone: this.joinForm.value.phone,
        StudentId: String(this.user?.id || this.joinForm.value.userId), // Automatically take connected student ID
        YearOfStudy: this.joinForm.value.yearOfStudy, // Keep as string ("1", "2")
        Motivation: this.joinForm.value.motivation,
        Skills: this.joinForm.value.skills,
        TermsAccepted: this.joinForm.value.termsAccepted,
        Date_Inscription: new Date().toISOString().substring(0, 19) // Format: YYYY-MM-DDTHH:mm:ss
      };

      console.log('Submitting Club Registration Payload:', registrationData);

      this.clubRegistrationService.createRegistration(registrationData).subscribe({
        next: (response) => {
          this.notificationService.success(`Your application to join ${this.clubName} has been submitted!`);
          this.joined.emit();
          this.close.emit();
        },
        error: (error) => {
          console.error('FULL REGISTRATION ERROR OBJECT:', error);
          this.isSubmitting = false;
          
          let errorMsg = 'Registration failed (400 Bad Request)';
          
          // Try to extract detailed error from backend
          if (error.error) {
            if (typeof error.error === 'string') {
                errorMsg = error.error;
            } else if (error.error.message) {
                errorMsg = error.error.message;
            } else if (typeof error.error === 'object') {
                errorMsg = JSON.stringify(error.error);
            }
          }
          
          this.notificationService.error(`Failed: ${errorMsg}`);
          console.error('Extracted error details:', errorMsg);
        }
      });
    }
  }

  onCancel() {
    this.close.emit();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}
