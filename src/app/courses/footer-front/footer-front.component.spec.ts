import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterFrontComponent } from './footer-front.component';

describe('FooterFrontComponent', () => {
  let component: FooterFrontComponent;
  let fixture: ComponentFixture<FooterFrontComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterFrontComponent, HttpClientTestingModule, RouterTestingModule.withRoutes([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterFrontComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
