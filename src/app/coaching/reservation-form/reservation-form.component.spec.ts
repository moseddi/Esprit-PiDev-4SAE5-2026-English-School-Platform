import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReservationFormComponent } from './reservation-form.component';
import { CoachingService } from '../service/coaching.service';

describe('ReservationFormComponent - create mode', () => {
  let component: ReservationFormComponent;
  let fixture: ComponentFixture<ReservationFormComponent>;
  let coachingServiceSpy: jasmine.SpyObj<CoachingService>;
  let router: Router;

  beforeEach(async () => {
    coachingServiceSpy = jasmine.createSpyObj('CoachingService', ['getReservationById', 'createReservation', 'updateReservation']);

    await TestBed.configureTestingModule({
      imports: [ReservationFormComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: CoachingService, useValue: coachingServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (key: string) => key === 'seanceId' ? '3' : null } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set seanceId from route', () => {
    expect(component.seanceId).toBe(3);
    expect(component.isEditMode).toBeFalse();
  });

  it('should call createReservation on submit', () => {
    coachingServiceSpy.createReservation.and.returnValue(of({ id: 1, studidname: 'Alice', merenumber: '2026-05-01', status: 'CONFIRMED' }));
    component.onSubmit();
    expect(coachingServiceSpy.createReservation).toHaveBeenCalledWith(3, jasmine.any(Object));
    expect(component.notification?.type).toBe('success');
  });

  it('should show error on create failure', () => {
    coachingServiceSpy.createReservation.and.returnValue(throwError(() => new Error('fail')));
    component.onSubmit();
    expect(component.notification?.type).toBe('error');
  });

  it('should show notification', () => {
    component.showNotification('Test', 'error');
    expect(component.notification?.type).toBe('error');
  });
});

describe('ReservationFormComponent - edit mode', () => {
  let component: ReservationFormComponent;
  let fixture: ComponentFixture<ReservationFormComponent>;
  let coachingServiceSpy: jasmine.SpyObj<CoachingService>;

  beforeEach(async () => {
    coachingServiceSpy = jasmine.createSpyObj('CoachingService', ['getReservationById', 'createReservation', 'updateReservation']);
    coachingServiceSpy.getReservationById.and.returnValue(of({ id: 7, studidname: 'Bob', merenumber: '2026-05-02', status: 'PENDING' }));

    await TestBed.configureTestingModule({
      imports: [ReservationFormComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: CoachingService, useValue: coachingServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (key: string) => key === 'id' ? '7' : null } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load reservation in edit mode', () => {
    expect(component.isEditMode).toBeTrue();
    expect(coachingServiceSpy.getReservationById).toHaveBeenCalledWith(7);
    expect(component.reservation.studidname).toBe('Bob');
  });

  it('should call updateReservation on submit', () => {
    coachingServiceSpy.updateReservation.and.returnValue(of({ id: 7, studidname: 'Bob', merenumber: '2026-05-02', status: 'CONFIRMED' }));
    component.onSubmit();
    expect(coachingServiceSpy.updateReservation).toHaveBeenCalledWith(7, jasmine.any(Object));
    expect(component.notification?.type).toBe('success');
  });

  it('should show error on update failure', () => {
    coachingServiceSpy.updateReservation.and.returnValue(throwError(() => new Error('fail')));
    component.onSubmit();
    expect(component.notification?.type).toBe('error');
  });

  it('should show error on loadReservation failure', () => {
    coachingServiceSpy.getReservationById.and.returnValue(throwError(() => new Error('fail')));
    component.loadReservation(7);
    expect(component.notification?.type).toBe('error');
    expect(component.loading).toBeFalse();
  });
});
