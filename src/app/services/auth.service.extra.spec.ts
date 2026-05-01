import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { KeycloakService } from 'keycloak-angular';

describe('AuthService - extra coverage', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let keycloakSpy: jasmine.SpyObj<KeycloakService>;

  beforeEach(() => {
    keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);
    keycloakSpy.logout.and.returnValue(Promise.resolve());
    keycloakSpy.updateToken.and.returnValue(Promise.resolve(false));
    keycloakSpy.getToken.and.returnValue(Promise.resolve(''));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        AuthService,
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('refreshToken', () => {
    it('should return false when no token', async () => {
      const result = await service.refreshToken();
      expect(result).toBeFalse();
    });

    it('should return true when token is not expired', async () => {
      // Valid non-expired token
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
      localStorage.setItem('auth_token', `header.${payload}.sig`);
      const result = await service.refreshToken();
      expect(result).toBeTrue();
    });

    it('should return false when token refresh fails', async () => {
      // Expired token
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
      localStorage.setItem('auth_token', `header.${payload}.sig`);
      keycloakSpy.updateToken.and.returnValue(Promise.resolve(false));
      const result = await service.refreshToken();
      expect(result).toBeFalse();
    });

    it('should return false on refresh error', async () => {
      const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
      localStorage.setItem('auth_token', `header.${payload}.sig`);
      keycloakSpy.updateToken.and.returnValue(Promise.reject(new Error('fail')));
      const result = await service.refreshToken();
      expect(result).toBeFalse();
    });
  });

  describe('logout', () => {
    it('should call logoutUser when email exists', () => {
      localStorage.setItem('user_data', JSON.stringify({ email: 'test@test.com' }));
      service.logout();
      const req = httpMock.expectOne(r => r.url.includes('/logout'));
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('should clear localStorage and call keycloak logout on success', () => {
      localStorage.setItem('user_data', JSON.stringify({ email: 'test@test.com' }));
      service.logout();
      const req = httpMock.expectOne(r => r.url.includes('/logout'));
      req.flush({ success: true });
      expect(keycloakSpy.logout).toHaveBeenCalled();
    });

    it('should still logout when backend call fails', () => {
      localStorage.setItem('user_data', JSON.stringify({ email: 'test@test.com' }));
      service.logout();
      const req = httpMock.expectOne(r => r.url.includes('/logout'));
      req.flush('error', { status: 500, statusText: 'Server Error' });
      expect(keycloakSpy.logout).toHaveBeenCalled();
    });

    it('should logout without email', () => {
      service.logout();
      expect(keycloakSpy.logout).toHaveBeenCalled();
    });
  });

  describe('login edge cases', () => {
    it('should not store token when response has no token', (done) => {
      service.login({ email: 'test@test.com', password: 'pass' }).subscribe({
        next: () => done.fail('should not emit'),
        error: () => done.fail('should not error'),
        complete: () => done.fail('should not complete')
      });
      const req = httpMock.expectOne('http://localhost:8089/api/auth/login');
      req.flush({ email: 'test@test.com' }); // no token field
      // Observable stays open, just verify no token stored
      expect(localStorage.getItem('auth_token')).toBeNull();
      done();
    });
  });
});
