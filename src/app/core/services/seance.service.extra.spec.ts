import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SeanceService } from './seance.service';
import { Seance } from '../../models';

describe('SeanceService - extra coverage', () => {
  let service: SeanceService;
  let httpMock: HttpTestingController;
  const base = 'http://localhost:8089/api/seances';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SeanceService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SeanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should GET seances by classeId', () => {
    service.getByClasseId(2).subscribe();
    const req = httpMock.expectOne(`${base}/classe/2`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should GET salles', () => {
    service.getSalles().subscribe();
    const req = httpMock.expectOne(`${base}/salles`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should POST create without classeId', () => {
    const seance = { dateDebut: '2026-05-01T09:00:00', dateFin: '2026-05-01T11:00:00', type: 'PRESENTIEL', salleId: 1 } as Seance;
    service.create(seance).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({ warnings: [] });
  });

  it('should PUT update with classeId', () => {
    const seance = { dateDebut: '2026-05-01T09:00:00', dateFin: '2026-05-01T11:00:00', type: 'PRESENTIEL', salleId: 1 } as Seance;
    service.update(3, seance, 5).subscribe();
    const req = httpMock.expectOne(`${base}/3?classeId=5`);
    expect(req.request.method).toBe('PUT');
    req.flush({ warnings: [] });
  });

  it('should DELETE seance', () => {
    service.delete(4).subscribe();
    const req = httpMock.expectOne(`${base}/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should POST assigner classe', () => {
    service.assignerClasse(1, 2).subscribe();
    const req = httpMock.expectOne(`${base}/1/classe/2`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should GET occupied salles without excludeId', () => {
    service.getOccupiedSalles('2026-05-01T09:00', '2026-05-01T11:00').subscribe();
    const req = httpMock.expectOne(`${base}/salles/occupees?debut=2026-05-01T09:00&fin=2026-05-01T11:00`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should GET occupied classes with excludeId', () => {
    service.getOccupiedClasses('2026-05-01T09:00', '2026-05-01T11:00', 3).subscribe();
    const req = httpMock.expectOne(`${base}/classes/occupees?debut=2026-05-01T09:00&fin=2026-05-01T11:00&excludeId=3`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should GET occupied classes without excludeId', () => {
    service.getOccupiedClasses('2026-05-01T09:00', '2026-05-01T11:00').subscribe();
    const req = httpMock.expectOne(`${base}/classes/occupees?debut=2026-05-01T09:00&fin=2026-05-01T11:00`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should GET stats', () => {
    service.getStats().subscribe();
    const req = httpMock.expectOne(`${base}/stats`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
