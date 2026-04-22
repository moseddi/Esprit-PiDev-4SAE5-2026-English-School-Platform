import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorViewComponent } from './tutor-view.component';

describe('TutorViewComponent', () => {
  let component: TutorViewComponent;
  let fixture: ComponentFixture<TutorViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutorViewComponent, HttpClientTestingModule, RouterTestingModule.withRoutes([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TutorViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
