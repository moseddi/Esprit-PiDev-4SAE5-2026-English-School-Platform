import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarFrontComponent } from './navbar-front.component';

describe('NavbarFrontComponent', () => {
  let component: NavbarFrontComponent;
  let fixture: ComponentFixture<NavbarFrontComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarFrontComponent, HttpClientTestingModule, RouterTestingModule.withRoutes([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarFrontComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
