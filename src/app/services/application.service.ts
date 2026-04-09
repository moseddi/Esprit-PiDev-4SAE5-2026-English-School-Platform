import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Application, ApplicationRequest, ApplicationStatus, JobOffer } from '../models/application.models';

@Injectable({ providedIn: 'root' })
export class ApplicationService {

  // Proxy rules in proxy.conf.json rewrite:
  //   /career-api/**  →  http://localhost:8082/**
  private readonly baseJobs = `/career-api/joboffers`;
  private readonly baseApps = `/career-api/applications`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    // Check if we have a token in localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  // ─── Job Offers ───────────────────────────────────────────────────────────

  getAllJobs(): Observable<JobOffer[]> {
    return this.http.get<JobOffer[]>(this.baseJobs, { headers: this.getHeaders() }).pipe(
      tap(jobs => console.log(`✅ [GET] job-offers → ${jobs.length} offers`)),
      catchError(err => {
        console.error('❌ [GET] job-offers failed:', err);
        return throwError(() => err);
      })
    );
  }

  getActiveJobs(): Observable<JobOffer[]> {
    return this.http.get<JobOffer[]>(`${this.baseJobs}/active`, { headers: this.getHeaders() }).pipe(
      tap(jobs => console.log(`✅ [GET] job-offers/active → ${jobs.length} offers`)),
      catchError(err => {
        console.warn('⚠️ [GET] job-offers/active failed, using fallback samples:', err);
        const samples: JobOffer[] = [
          { id: 1, title: 'English Teacher (Full Time)', description: 'Looking for an experienced English teacher for our new center in Paris.', companyName: 'Wall Street English', location: 'Paris, France', contractType: 'CDI', salary: 42000, active: true, publicationDate: '2026-03-01' },
          { id: 2, title: 'Customer Success Specialist', description: 'Help our students achieve their goals and manage their learning path.', companyName: 'WSE Group', location: 'Remote / Lyon', contractType: 'CDD', salary: 38000, active: true, publicationDate: '2026-03-15' },
          { id: 3, title: 'English Software Engineer', description: 'Join our tech team to build the next generation of learning tools.', companyName: 'Edutech Ltd', location: 'Bordeaux', contractType: 'Freelance', salary: 55000, active: true, publicationDate: '2026-03-20' }
        ];
        return new Observable<JobOffer[]>(observer => {
          observer.next(samples);
          observer.complete();
        });
      })
    );
  }

  getJobById(id: number): Observable<JobOffer> {
    return this.http.get<JobOffer>(`${this.baseJobs}/${id}`, { headers: this.getHeaders() }).pipe(
      tap(job => console.log(`✅ [GET] job-offer/${id}:`, job.title)),
      catchError(err => {
        console.error(`❌ [GET] job-offer/${id} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  createJob(job: JobOffer): Observable<JobOffer> {
    // Remove id before sending (backend auto-generates it)
    const { id, ...payload } = job as any;
    console.log('📤 [POST] job-offers payload:', payload);
    return this.http.post<JobOffer>(this.baseJobs, payload, { headers: this.getHeaders() }).pipe(
      tap(created => console.log('✅ [POST] job-offer created with id:', created.id)),
      catchError(err => {
        console.error('❌ [POST] job-offers failed:', err);
        return throwError(() => err);
      })
    );
  }

  updateJob(id: number, job: JobOffer): Observable<JobOffer> {
    console.log(`📤 [PUT] job-offers/${id} payload:`, job);
    return this.http.put<JobOffer>(`${this.baseJobs}/${id}`, job, { headers: this.getHeaders() }).pipe(
      tap(updated => console.log(`✅ [PUT] job-offer/${id} updated:`, updated.title)),
      catchError(err => {
        console.error(`❌ [PUT] job-offers/${id} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseJobs}/${id}`, { headers: this.getHeaders() }).pipe(
      tap(() => console.log(`✅ [DELETE] job-offer/${id} deleted`)),
      catchError(err => {
        console.error(`❌ [DELETE] job-offers/${id} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  toggleJobActive(id: number, job: JobOffer): Observable<JobOffer> {
    const toggled = { ...job, active: !job.active };
    return this.updateJob(id, toggled);
  }

  // ─── Applications ─────────────────────────────────────────────────────────

  getAll(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.baseApps}`, { headers: this.getHeaders() }).pipe(
      tap(apps => console.log(`✅ [GET] applications → ${apps.length} apps`)),
      catchError(err => {
        console.error('❌ [GET] applications failed:', err);
        return throwError(() => err);
      })
    );
  }

  getMyApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.baseApps}/my`, { headers: this.getHeaders() }).pipe(
      tap(apps => console.log(`✅ [GET] my applications → ${apps.length} apps`)),
      catchError(err => {
        console.error('❌ [GET] my applications failed:', err);
        return throwError(() => err);
      })
    );
  }

  applyToJob(request: ApplicationRequest): Observable<Application> {
    console.log('📤 [POST] applications payload:', request);
    return this.http.post<Application>(this.baseApps, request, { headers: this.getHeaders() }).pipe(
      tap(app => {
        console.log(`✅ [POST] application created with id:`, app.id);
        this.saveLocalApplication(app);
      }),
      catchError(err => {
        console.warn('⚠️ [POST] applications failed, using local storage fallback:', err);
        // Fallback: save locally and return a mock Application object
        const mockApp: Application = {
          id: Math.floor(Math.random() * 10000),
          userId: 0, // Will be handled by local logic if needed
          bio: request.bio,
          specialty: request.specialty,
          experience: request.experience,
          status: ApplicationStatus.PENDING,
          createdAt: new Date().toISOString(),
          jobOfferId: request.jobOfferId,
          jobOfferTitle: 'Local Application'
        };
        this.saveLocalApplication(mockApp);
        return new Observable<Application>(observer => {
          observer.next(mockApp);
          observer.complete();
        });
      })
    );
  }

  private saveLocalApplication(app: Application): void {
    const localApps = JSON.parse(localStorage.getItem('local_applications') || '[]');
    localApps.push(app);
    localStorage.setItem('local_applications', JSON.stringify(localApps));
  }

  updateStatus(id: number, status: ApplicationStatus): Observable<Application> {
    return this.http.put<Application>(
      `${this.baseApps}/${id}/status`,
      { status },
      { headers: this.getHeaders() }
    ).pipe(
      tap(app => console.log(`✅ [PUT] application/${id} status → ${app.status}`)),
      catchError(err => {
        console.error(`❌ [PUT] application/${id}/status failed:`, err);
        return throwError(() => err);
      })
    );
  }
}
