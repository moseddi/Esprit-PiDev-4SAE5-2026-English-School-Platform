import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { KeycloakService } from 'keycloak-angular';

describe('UserService - extra coverage', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  const base = 'http://localhost:8089/api/users';

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'getUser']);
    authServiceSpy.getToken.and.returnValue('valid-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        UserService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: KeycloakService, useValue: jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']) }
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.clearCache();
  });

  it('should GET user by email', () => {
    service.getUserByEmail('test@test.com').subscribe();
    const req = httpMock.expectOne(`${base}/email/test@test.com`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 1, email: 'test@test.com' });
  });

  it('should PUT update user by email', () => {
    service.updateUserByEmail('test@test.com', { firstName: 'John' }).subscribe();
    const req = httpMock.expectOne(`${base}/profile/test@test.com`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 1, email: 'test@test.com', firstName: 'John' });
  });

  it('should return 401 error when no token', () => {
    authServiceSpy.getToken.and.returnValue(null);
    service.getAllUsers().subscribe({
      error: (err) => expect(err.status).toBe(401)
    });
  });

  it('should return stale cache on 500 error', () => {
    // First load to populate cache
    service.getAllUsers().subscribe();
    httpMock.expectOne(base).flush([{ id: 1 }]);

    // Force cache to expire by clearing timestamp
    (service as any).cacheTimestamp = 0;

    // Second call should hit HTTP and fail, returning stale cache
    service.getAllUsers().subscribe(users => {
      expect(users.length).toBe(1);
    });
    httpMock.expectOne(base).flush('error', { status: 500, statusText: 'Server Error' });
  });

  it('should preload users when token is valid', () => {
    // Create a valid non-expired JWT
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    authServiceSpy.getToken.and.returnValue(`header.${payload}.sig`);
    service.preloadUsers();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }]);
  });

  it('should skip preload when already loading', () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    authServiceSpy.getToken.and.returnValue(`header.${payload}.sig`);
    service.preloadUsers();
    service.preloadUsers(); // second call should be skipped
    const reqs = httpMock.match(base);
    expect(reqs.length).toBe(1);
    reqs[0].flush([]);
  });

  it('should skip preload when no token', () => {
    authServiceSpy.getToken.and.returnValue(null);
    service.preloadUsers();
    httpMock.expectNone(base);
  });

  it('should handle 401 error on getUserById', () => {
    service.getUserById(1).subscribe({
      error: (err) => expect(err.status).toBe(401)
    });
    httpMock.expectOne(`${base}/1`).flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('should handle 401 error on getUserByEmail', () => {
    service.getUserByEmail('test@test.com').subscribe({
      error: (err) => expect(err.status).toBe(401)
    });
    httpMock.expectOne(`${base}/email/test@test.com`).flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });
});
