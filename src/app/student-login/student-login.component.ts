import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../assessment_project/shared/services/auth.service';

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './student-login.component.html',
  styleUrls: ['./student-login.component.css']
})
export class StudentLoginComponent {
  loginData = {
    email: '',
    password: ''
  };

  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onSubmit() {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'L\'email et le mot de passe sont requis';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (user) => {
        this.isLoading = false;
        if (user.role === 'ADMIN') {
          this.router.navigate(['/backoffice/game-sessions']);
        } else {
          this.router.navigate(['/assessment/frontoffice']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Email ou mot de passe incorrect.';
      }
    });
  }

  socialLogin(provider: string) {
    console.log(`Login with ${provider}`);
    this.errorMessage = `${provider} login coming soon!`;
  }
}