import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SeanceFormComponent } from './seance-form.component';
import { CoachingService } from '../service/coaching.service';

describe('SeanceFormComponent - create mode', () => {
  let component: SeanceFormComponent;
  let fixture: ComponentFixture<SeanceFormComponent>;
  let coachingServiceSpy: jasmine.SpyObj<CoachingService>;
  let router: Router;

  beforeEach(async () => {
    coachingServiceSpy = jasmine.createSpyObj('CoachingService', ['getSeanceById', 'createSeance', 'updateSeance']);

    await TestBed.configureTestingModule({
      imports: [SeanceFormComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: CoachingService, useValue: coachingServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SeanceFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be in create mode by default', () => {
    expect(component.isEditMode).toBeFalse();
  });

  it('should call createSeance on submit in create mode', () => {
    coachingServiceSpy.createSeance.and.returnValue(of({ goodName: 'Test', seanceDate: '2026-05-01', seanceTime: '10:00' }));
    component.seance = { goodName: 'Test', seanceDate: '2026-05-01', seanceTime: '10:00' };
    component.onSubmit();
    expect(coachingServiceSpy.createSeance).toHaveBeenCalled();
    expect(component.notification?.type).toBe('success');
  });

  it('should show error notification on create failure', () => {
    coachingServiceSpy.createSeance.and.returnValue(throwError(() => new Error('fail')));
    component.onSubmit();
    expect(component.notification?.type).toBe('error');
  });

  it('should show notification', () => {
    component.showNotification('Test message', 'success');
    expect(component.notification?.message).toBe('Test message');
  });
});

describe('SeanceFormComponent - edit mode', () => {
  let component: SeanceFormComponent;
  let fixture: ComponentFixture<SeanceFormComponent>;
  let coachingServiceSpy: jasmine.SpyObj<CoachingService>;

  beforeEach(async () => {
    coachingServiceSpy = jasmine.createSpyObj('CoachingService', ['getSeanceById', 'createSeance', 'updateSeance']);
    coachingServiceSpy.getSeanceById.and.returnValue(of({ id: 5, goodName: 'Existing', seanceDate: '2026-05-01', seanceTime: '10:00' }));

    await TestBed.configureTestingModule({
      imports: [SeanceFormComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: CoachingService, useValue: coachingServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '5' } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SeanceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load seance in edit mode', () => {
    expect(component.isEditMode).toBeTrue();
    expect(coachingServiceSpy.getSeanceById).toHaveBeenCalledWith(5);
    expect(component.seance.goodName).toBe('Existing');
  });

  it('should call updateSeance on submit in edit mode', () => {
    coachingServiceSpy.updateSeance.and.returnValue(of({ id: 5, goodName: 'Updated', seanceDate: '2026-05-01', seanceTime: '10:00' }));
    component.onSubmit();
    expect(coachingServiceSpy.updateSeance).toHaveBeenCalledWith(5, jasmine.any(Object));
    expect(component.notification?.type).toBe('success');
  });

  it('should show error on update failure', () => {
    coachingServiceSpy.updateSeance.and.returnValue(throwError(() => new Error('fail')));
    component.onSubmit();
    expect(component.notification?.type).toBe('error');
  });

  it('should show error on loadSeance failure', () => {
    coachingServiceSpy.getSeanceById.and.returnValue(throwError(() => new Error('fail')));
    component.loadSeance(5);
    expect(component.notification?.type).toBe('error');
    expect(component.loading).toBeFalse();
  });
});
