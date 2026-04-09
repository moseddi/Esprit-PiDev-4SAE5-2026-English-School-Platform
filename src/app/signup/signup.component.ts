import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../assessment_project/shared/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupData = {
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'PLAYER' as 'ADMIN' | 'PLAYER'
  };

  acceptTerms = false;
  isLoading = false;
  signupSuccess = false;
  errorMessage = '';

  // Track touched fields
  usernameTouched = false;
  emailTouched = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  validateEmail(): string | null {
    if (!this.emailTouched || !this.signupData.email) return null;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return !emailRegex.test(this.signupData.email) ? 'Veuillez entrer une adresse email valide' : null;
  }

  // Password strength logic (keeping it for UI excellence)
  get hasMinLength(): boolean { return this.signupData.password.length >= 8; }
  get hasUpperCase(): boolean { return /[A-Z]/.test(this.signupData.password); }
  get hasLowerCase(): boolean { return /[a-z]/.test(this.signupData.password); }
  get hasNumber(): boolean { return /[0-9]/.test(this.signupData.password); }
  get hasSpecialChar(): boolean { return /[!@#$%^&*(),.?":{}|<>]/.test(this.signupData.password); }

  getPasswordStrengthClass(): string {
    const s = this.calculateStrength();
    if (s <= 2) return 'weak';
    if (s <= 4) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const s = this.calculateStrength();
    if (s <= 2) return 'Faible';
    if (s <= 4) return 'Moyen';
    return 'Fort';
  }

  private calculateStrength(): number {
    let s = 0;
    if (this.hasMinLength) s++;
    if (this.hasUpperCase) s++;
    if (this.hasLowerCase) s++;
    if (this.hasNumber) s++;
    if (this.hasSpecialChar) s++;
    return s;
  }

  onSubmit() {
    if (!this.signupData.username || !this.signupData.email || !this.signupData.password) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    if (this.signupData.password !== this.signupData.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (!this.acceptTerms) {
      this.errorMessage = 'Vous devez accepter les conditions d\'utilisation.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register({
      username: this.signupData.username,
      email: this.signupData.email,
      password: this.signupData.password,
      role: this.signupData.role
    }).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.signupSuccess = true;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Erreur lors de l\'inscription.';
      }
    });
  }

  socialSignup(provider: string) {
    console.log(`Signup with ${provider}`);
  }
}