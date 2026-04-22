import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeCoursStudentComponent } from './liste-cours-student.component';

describe('ListeCoursStudentComponent', () => {
  let component: ListeCoursStudentComponent;
  let fixture: ComponentFixture<ListeCoursStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeCoursStudentComponent, HttpClientTestingModule, RouterTestingModule.withRoutes([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeCoursStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
