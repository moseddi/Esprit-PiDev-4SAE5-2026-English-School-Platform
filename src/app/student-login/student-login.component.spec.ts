import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { StudentLoginComponent } from './student-login.component';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

describe('StudentLoginComponent', () => {
  let component: StudentLoginComponent;
  let fixture: ComponentFixture<StudentLoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [StudentLoginComponent, FormsModule, RouterTestingModule.withRoutes([]), HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentLoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error message if form is submitted empty', () => {
    component.loginData.email = '';
    component.loginData.password = '';
    
    component.onSubmit();
    
    expect(component.errorMessage).toEqual('Email and password are required');
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should call authService and navigate to backoffice if role is ADMIN', () => {
    component.loginData.email = 'admin@test.com';
    component.loginData.password = 'password123';
    
    authServiceSpy.login.and.returnValue(of({ role: 'ADMIN' }));
    
    component.onSubmit();
    
    expect(component.isLoading).toBeFalse();
    expect(authServiceSpy.login).toHaveBeenCalledWith(component.loginData);
    expect(router.navigate).toHaveBeenCalledWith(['/backoffice']);
  });

  it('should call authService and navigate to frontoffice if role is TUTOR', () => {
    component.loginData.email = 'tutor@test.com';
    component.loginData.password = 'password123';
    
    authServiceSpy.login.and.returnValue(of({ role: 'TUTOR' }));
    
    component.onSubmit();
    
    expect(router.navigate).toHaveBeenCalledWith(['/frontoffice']);
  });

  it('should call authService and navigate to home if role is STUDENT', () => {
    component.loginData.email = 'student@test.com';
    component.loginData.password = 'password123';
    
    authServiceSpy.login.and.returnValue(of({ role: 'STUDENT' }));
    
    component.onSubmit();
    
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should call authService and navigate to / if role is UNKNOWN', () => {
    component.loginData.email = 'unknown@test.com';
    component.loginData.password = 'password123';
    
    authServiceSpy.login.and.returnValue(of({ role: 'UNKNOWN' }));
    
    component.onSubmit();
    
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should display error message on login failure', () => {
    component.loginData.email = 'test@test.com';
    component.loginData.password = 'wrongpassword';
    const errorResponse = { error: { message: 'Invalid credentials' } };
    
    authServiceSpy.login.and.returnValue(throwError(() => errorResponse));
    
    component.onSubmit();
    
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toEqual('Invalid credentials');
  });

  it('should set default error message if error response has no message', () => {
    component.loginData.email = 'test@test.com';
    component.loginData.password = 'wrongpassword';
    
    authServiceSpy.login.and.returnValue(throwError(() => ({})));
    
    component.onSubmit();
    
    expect(component.errorMessage).toEqual('Invalid email or password');
  });

  it('should test socialLogin method', () => {
    component.socialLogin('Google');
    expect(component.errorMessage).toEqual('Google login coming soon!');
  });
});
