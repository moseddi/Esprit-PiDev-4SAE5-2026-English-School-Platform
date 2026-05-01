import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MaterielService } from './materiel.service';

describe('MaterielService - extra coverage', () => {
  let service: MaterielService;
  let httpMock: HttpTestingController;
  const api = 'http://localhost:8089/api/materiels';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MaterielService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MaterielService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should GET all materiels', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne(api);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should GET materiel by id', () => {
    service.getById(3).subscribe();
    const req = httpMock.expectOne(`${api}/3`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should POST create without salleId', () => {
    service.create('Projecteur', 'AVAILABLE', 5, 1, 100).subscribe();
    const req = httpMock.expectOne(api);
    expect(req.request.method).toBe('POST');
    req.flush({ materiel: {}, warnings: [] });
  });

  it('should POST create with null salleId', () => {
    service.create('Projecteur', 'AVAILABLE', 5, 1, 100, null).subscribe();
    const req = httpMock.expectOne(api);
    expect(req.request.method).toBe('POST');
    req.flush({ materiel: {}, warnings: [] });
  });

  it('should PUT update with salleId', () => {
    service.update(2, 'Tableau', 'IN_USE', 3, 1, 50, 1).subscribe();
    const req = httpMock.expectOne(`${api}/2?salleId=1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ materiel: {}, warnings: [] });
  });

  it('should PUT update without salleId', () => {
    service.update(2, 'Tableau', 'IN_USE', 3, 1, 50, null).subscribe();
    const req = httpMock.expectOne(`${api}/2`);
    expect(req.request.method).toBe('PUT');
    req.flush({ materiel: {}, warnings: [] });
  });

  it('should DELETE materiel', () => {
    service.delete(5).subscribe();
    const req = httpMock.expectOne(`${api}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ deleted: true });
  });
});
