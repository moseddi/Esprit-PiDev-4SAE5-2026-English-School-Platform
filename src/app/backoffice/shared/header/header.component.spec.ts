import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from './header.component';
import { NotificationService, CourseNotification } from '../../../services/notification.service';
import { BehaviorSubject } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  const notificationsSubject = new BehaviorSubject<CourseNotification[]>([]);

  const mockNotif: CourseNotification = {
    type: 'COURSE_CREATED', message: 'New course', courseId: 1, courseTitle: 'English', timestamp: Date.now()
  };

  beforeEach(async () => {
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['connect', 'clearNotifications']);
    (notificationServiceSpy as any).notifications$ = notificationsSubject.asObservable();

    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should connect to notification service on init', () => {
    expect(notificationServiceSpy.connect).toHaveBeenCalled();
  });

  it('should update notifications from service', () => {
    notificationsSubject.next([mockNotif]);
    expect(component.notifications.length).toBe(1);
    expect(component.unreadCount).toBe(1);
  });

  describe('toggleDropdown', () => {
    it('should toggle showDropdown', () => {
      expect(component.showDropdown).toBeFalse();
      component.toggleDropdown();
      expect(component.showDropdown).toBeTrue();
    });

    it('should mark all as read when opening', () => {
      notificationsSubject.next([mockNotif]);
      component.toggleDropdown();
      expect(component.unreadCount).toBe(0);
    });

    it('should close dropdown on second toggle', () => {
      component.toggleDropdown();
      component.toggleDropdown();
      expect(component.showDropdown).toBeFalse();
    });
  });

  describe('clearAll', () => {
    it('should call clearNotifications and close dropdown', () => {
      component.showDropdown = true;
      component.clearAll();
      expect(notificationServiceSpy.clearNotifications).toHaveBeenCalled();
      expect(component.showDropdown).toBeFalse();
    });
  });

  describe('formatTime', () => {
    it('should return "À l\'instant" for recent timestamp', () => {
      expect(component.formatTime(Date.now())).toBe("À l'instant");
    });

    it('should return minutes ago for recent past', () => {
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      expect(component.formatTime(fiveMinAgo)).toContain('5 min');
    });

    it('should return hours ago for older timestamp', () => {
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      expect(component.formatTime(twoHoursAgo)).toContain('2h');
    });

    it('should return date for very old timestamp', () => {
      const oldTimestamp = new Date('2025-01-01').getTime();
      const result = component.formatTime(oldTimestamp);
      expect(result).toBeTruthy();
    });
  });

  describe('onDocumentClick', () => {
    it('should close dropdown when clicking outside', () => {
      component.showDropdown = true;
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: document.body });
      component.onDocumentClick(event);
      expect(component.showDropdown).toBeFalse();
    });
  });
});
