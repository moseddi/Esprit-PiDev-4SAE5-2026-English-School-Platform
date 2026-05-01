import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProfileCompletionComponent } from './profile-completion.component';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { KeycloakService } from 'keycloak-angular';

describe('ProfileCompletionComponent', () => {
  let component: ProfileCompletionComponent;
  let fixture: ComponentFixture<ProfileCompletionComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let router: Router;

  const mockAuthUser = { email: 'test@test.com', firstName: 'John', role: 'STUDENT' };
  const mockProfile = {
    email: 'test@test.com', firstName: 'John', lastName: 'Doe',
    phoneNumber: '12345678', dateOfBirth: '1990-01-15', address: '123 Main St', city: 'Tunis', country: 'TN'
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUser', 'getToken', 'isLoggedIn', 'updateUserData']);
    userServiceSpy = jasmine.createSpyObj('UserService', ['getUserByEmail', 'updateUserByEmail']);
    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);

    authServiceSpy.getUser.and.returnValue(mockAuthUser);
    userServiceSpy.getUserByEmail.and.returnValue(of(mockProfile));

    await TestBed.configureTestingModule({
      imports: [ProfileCompletionComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileCompletionComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user data on init', () => {
    expect(userServiceSpy.getUserByEmail).toHaveBeenCalledWith('test@test.com');
    expect(component.editData.firstName).toBe('John');
    expect(component.editData.city).toBe('Tunis');
  });

  it('should handle session expired on load error', () => {
    userServiceSpy.getUserByEmail.and.returnValue(throwError(() => ({ status: 401 })));
    const navigateSpy = spyOn(router, 'navigate');
    component.loadUserData();
    expect(component.errorMessage).toContain('session');
  });

  it('should handle generic error on load', () => {
    userServiceSpy.getUserByEmail.and.returnValue(throwError(() => ({ status: 500 })));
    component.loadUserData();
    expect(component.isLoading).toBeFalse();
  });

  it('should handle no auth user', () => {
    authServiceSpy.getUser.and.returnValue(null);
    component.loadUserData();
    expect(component.editData.firstName).toBe('');
  });

  describe('getInitials', () => {
    it('should return first letter of firstName', () => {
      component.user = { firstName: 'Alice' };
      expect(component.getInitials()).toBe('A');
    });

    it('should return first letter of email when no firstName', () => {
      component.user = { email: 'bob@test.com' };
      expect(component.getInitials()).toBe('B');
    });

    it('should return U when no user data', () => {
      component.user = {};
      expect(component.getInitials()).toBe('U');
    });
  });

  describe('toggleEdit', () => {
    it('should toggle isEditing', () => {
      expect(component.isEditing).toBeFalse();
      component.toggleEdit();
      expect(component.isEditing).toBeTrue();
    });

    it('should populate editData from user when entering edit mode', () => {
      component.user = { firstName: 'Jane', lastName: 'Smith', dateOfBirth: '1995-06-20' };
      component.toggleEdit();
      expect(component.editData.firstName).toBe('Jane');
    });

    it('should reset touched flags on toggle', () => {
      component.firstNameTouched = true;
      component.toggleEdit();
      expect(component.firstNameTouched).toBeFalse();
    });
  });

  describe('validation methods', () => {
    it('validateFirstName should return null when not touched', () => {
      component.firstNameTouched = false;
      expect(component.validateFirstName()).toBeNull();
    });

    it('validateFirstName should return error for empty name', () => {
      component.firstNameTouched = true;
      component.editData.firstName = '';
      expect(component.validateFirstName()).toBeTruthy();
    });

    it('validateFirstName should return error for name with numbers', () => {
      component.firstNameTouched = true;
      component.editData.firstName = 'John1';
      expect(component.validateFirstName()).toBeTruthy();
    });

    it('validateFirstName should return error for name too short', () => {
      component.firstNameTouched = true;
      component.editData.firstName = 'Jo';
      expect(component.validateFirstName()).toBeTruthy();
    });

    it('validateFirstName should return null for valid name', () => {
      component.firstNameTouched = true;
      component.editData.firstName = 'John';
      expect(component.validateFirstName()).toBeNull();
    });

    it('validateLastName should return null when not touched', () => {
      component.lastNameTouched = false;
      expect(component.validateLastName()).toBeNull();
    });

    it('validateLastName should return error for name with numbers', () => {
      component.lastNameTouched = true;
      component.editData.lastName = 'Doe2';
      expect(component.validateLastName()).toBeTruthy();
    });

    it('validateLastName should return null for valid name', () => {
      component.lastNameTouched = true;
      component.editData.lastName = 'Doe';
      expect(component.validateLastName()).toBeNull();
    });

    it('validatePhoneNumber should return null when not touched', () => {
      component.phoneNumberTouched = false;
      expect(component.validatePhoneNumber()).toBeNull();
    });

    it('validatePhoneNumber should return error for short phone', () => {
      component.phoneNumberTouched = true;
      component.editData.phoneNumber = '123';
      expect(component.validatePhoneNumber()).toBeTruthy();
    });

    it('validatePhoneNumber should return null for valid phone', () => {
      component.phoneNumberTouched = true;
      component.editData.phoneNumber = '12345678';
      expect(component.validatePhoneNumber()).toBeNull();
    });

    it('validateDateOfBirth should return error for future date', () => {
      component.dateOfBirthTouched = true;
      component.editData.dateOfBirth = '2099-01-01';
      expect(component.validateDateOfBirth()).toBeTruthy();
    });

    it('validateDateOfBirth should return null for past date', () => {
      component.dateOfBirthTouched = true;
      component.editData.dateOfBirth = '1990-01-01';
      expect(component.validateDateOfBirth()).toBeNull();
    });

    it('validateAddress should return error for short address', () => {
      component.addressTouched = true;
      component.editData.address = 'abc';
      expect(component.validateAddress()).toBeTruthy();
    });

    it('validateAddress should return null for valid address', () => {
      component.addressTouched = true;
      component.editData.address = '123 Main Street';
      expect(component.validateAddress()).toBeNull();
    });

    it('validateCity should return error for city with numbers', () => {
      component.cityTouched = true;
      component.editData.city = 'Tunis1';
      expect(component.validateCity()).toBeTruthy();
    });

    it('validateCity should return null for valid city', () => {
      component.cityTouched = true;
      component.editData.city = 'Tunis';
      expect(component.validateCity()).toBeNull();
    });
  });

  describe('blur handlers', () => {
    it('should set firstNameTouched on blur', () => {
      component.onFirstNameBlur();
      expect(component.firstNameTouched).toBeTrue();
    });

    it('should set lastNameTouched on blur', () => {
      component.onLastNameBlur();
      expect(component.lastNameTouched).toBeTrue();
    });

    it('should set phoneNumberTouched on blur', () => {
      component.onPhoneNumberBlur();
      expect(component.phoneNumberTouched).toBeTrue();
    });

    it('should set dateOfBirthTouched on blur', () => {
      component.onDateOfBirthBlur();
      expect(component.dateOfBirthTouched).toBeTrue();
    });

    it('should set addressTouched on blur', () => {
      component.onAddressBlur();
      expect(component.addressTouched).toBeTrue();
    });

    it('should set cityTouched on blur', () => {
      component.onCityBlur();
      expect(component.cityTouched).toBeTrue();
    });
  });

  describe('isFormValid', () => {
    it('should return true when no errors', () => {
      expect(component.isFormValid()).toBeTrue();
    });

    it('should return false when firstName has error', () => {
      component.firstNameTouched = true;
      component.editData.firstName = 'Jo';
      expect(component.isFormValid()).toBeFalse();
    });
  });

  describe('saveProfile', () => {
    it('should show error when firstName is empty', () => {
      component.editData.firstName = '';
      component.saveProfile();
      expect(component.errorMessage).toBeTruthy();
    });

    it('should show error when firstName is too short', () => {
      component.editData.firstName = 'Jo';
      component.saveProfile();
      expect(component.errorMessage).toBeTruthy();
    });

    it('should call updateUserByEmail on valid data', () => {
      userServiceSpy.updateUserByEmail.and.returnValue(of(mockProfile));
      component.user = { email: 'test@test.com' };
      component.editData = { firstName: 'John', lastName: 'Doe', phoneNumber: '', dateOfBirth: '', address: '', city: '', country: '' };
      component.saveProfile();
      expect(userServiceSpy.updateUserByEmail).toHaveBeenCalled();
    });

    it('should handle session expired on save error', () => {
      userServiceSpy.updateUserByEmail.and.returnValue(throwError(() => ({ status: 401 })));
      component.user = { email: 'test@test.com' };
      component.editData = { firstName: 'John', lastName: '', phoneNumber: '', dateOfBirth: '', address: '', city: '', country: '' };
      component.saveProfile();
      expect(component.errorMessage).toContain('session');
    });

    it('should set errorMessage on generic save error', () => {
      userServiceSpy.updateUserByEmail.and.returnValue(throwError(() => ({ status: 500, error: { message: 'Server error' } })));
      component.user = { email: 'test@test.com' };
      component.editData = { firstName: 'John', lastName: '', phoneNumber: '', dateOfBirth: '', address: '', city: '', country: '' };
      component.saveProfile();
      expect(component.errorMessage).toBeTruthy();
    });

    it('should show error when no email found', () => {
      authServiceSpy.getUser.and.returnValue(null);
      component.user = {};
      component.editData = { firstName: 'John', lastName: '', phoneNumber: '', dateOfBirth: '', address: '', city: '', country: '' };
      component.saveProfile();
      expect(component.errorMessage).toContain('email');
    });
  });

  describe('resetEditData', () => {
    it('should reset all edit fields', () => {
      component.editData.firstName = 'Test';
      component.resetEditData();
      expect(component.editData.firstName).toBe('');
    });
  });
});
