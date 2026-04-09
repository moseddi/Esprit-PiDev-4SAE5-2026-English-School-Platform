import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Application, ApplicationStatus, Level, JobOffer } from '../models/application.models';


@Injectable({
    providedIn: 'root'
})
export class ApplicationService {
    private readonly baseApps = `${'/kenwq-api'}/applications`;
    private readonly baseJobs = `${'/kenwq-api'}/job-offers`;

    private httpOptions = {
        headers: new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
    };

    private mockApplications: Application[] = [];
    private mockJobOffers: JobOffer[] = [];

    private applicationsSubject = new BehaviorSubject<Application[]>([]);
    private jobOffersSubject = new BehaviorSubject<JobOffer[]>([]);

    applications$ = this.applicationsSubject.asObservable();
    jobOffers$ = this.jobOffersSubject.asObservable();

    private readonly STORAGE_APPS_KEY = 'mock_applications';
    private readonly STORAGE_JOBS_KEY = 'mock_job_offers';

    constructor(private http: HttpClient) {
        this.loadFromStorage();
        if (this.mockJobOffers.length === 0) {
            this.initializeMockJobOffers();
        }
        if (this.mockApplications.length === 0) {
            this.initializeMockApplications();
        }
    }

    private loadFromStorage(): void {
        if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
        try {
            const storedApps = localStorage.getItem(this.STORAGE_APPS_KEY);
            if (storedApps) {
                this.mockApplications = JSON.parse(storedApps);
                this.applicationsSubject.next(this.mockApplications);
            }
            const storedJobs = localStorage.getItem(this.STORAGE_JOBS_KEY);
            if (storedJobs) {
                this.mockJobOffers = JSON.parse(storedJobs);
                this.jobOffersSubject.next(this.mockJobOffers);
            }
        } catch (error) {
            console.error('Error loading data from storage:', error);
        }
    }

    private saveToStorage(): void {
        if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.STORAGE_APPS_KEY, JSON.stringify(this.mockApplications));
            localStorage.setItem(this.STORAGE_JOBS_KEY, JSON.stringify(this.mockJobOffers));
        } catch (error) {
            console.error('Error saving data to storage:', error);
        }
    }

    private initializeMockJobOffers(): void {
        this.mockJobOffers = [
            {
                id: 1,
                title: 'Développeur Angular Senior',
                description: 'Expertise Angular et RxJS requise pour une plateforme innovante.',
                requiredLevel: Level.B2,
                active: true
            },
            {
                id: 2,
                title: 'Designer UI/UX',
                description: 'Création d\'interfaces mobiles et web modernes.',
                requiredLevel: Level.B1,
                active: true
            }
        ];
        this.jobOffersSubject.next(this.mockJobOffers);
        this.saveToStorage();
    }

    private initializeMockApplications(): void {
        this.mockApplications = [
            {
                id: 1,
                status: ApplicationStatus.PENDING,
                userId: 101,
                jobOffer: this.mockJobOffers[0]
            },
            {
                id: 2,
                status: ApplicationStatus.ACCEPTED,
                userId: 102,
                jobOffer: this.mockJobOffers[1]
            },
            {
                id: 3,
                status: ApplicationStatus.REJECTED,
                userId: 103,
                jobOffer: this.mockJobOffers[0]
            }
        ];
        this.applicationsSubject.next(this.mockApplications);
        this.saveToStorage();
    }

    getAll(): Observable<Application[]> {
        console.log('Fetching all applications...');
        return this.http.get<Application[]>(this.baseApps, this.httpOptions).pipe(
            tap((apps) => {
                console.log('Applications received from API:', apps?.length);
                if (apps && apps.length > 0) {
                    this.mockApplications = apps;
                    this.applicationsSubject.next(this.mockApplications);
                    this.saveToStorage();
                } else {
                    this.applicationsSubject.next(this.mockApplications);
                }
            }),
            catchError((error) => {
                console.warn('API applications failed, returning mocks:', error.message);
                this.applicationsSubject.next(this.mockApplications);
                return of(this.mockApplications);
            })
        );
    }

    submitApplication(app: Partial<Application>): Observable<Application> {
        return this.http.post<Application>(this.baseApps, app, this.httpOptions).pipe(
            tap((newApp) => {
                this.mockApplications.push(newApp);
                this.applicationsSubject.next(this.mockApplications);
                this.saveToStorage();
            }),
            catchError(() => {
                const newApp = { 
                  ...app as Application, 
                  id: Math.max(...this.mockApplications.map(a => a.id), 0) + 1,
                  status: ApplicationStatus.PENDING
                };
                this.mockApplications.push(newApp);
                this.applicationsSubject.next(this.mockApplications);
                this.saveToStorage();
                return of(newApp);
            })
        );
    }

    updateStatus(id: number, status: ApplicationStatus): Observable<Application> {
        return this.http.patch<Application>(`${this.baseApps}/${id}/status`, { status }, this.httpOptions).pipe(
            tap((updatedApp) => {
                const index = this.mockApplications.findIndex(a => a.id === id);
                if (index !== -1) {
                    this.mockApplications[index] = updatedApp;
                    this.applicationsSubject.next(this.mockApplications);
                    this.saveToStorage();
                }
            }),
            catchError(() => {
                const index = this.mockApplications.findIndex(a => a.id === id);
                if (index !== -1) {
                    this.mockApplications[index].status = status;
                    this.applicationsSubject.next(this.mockApplications);
                    this.saveToStorage();
                    return of(this.mockApplications[index]);
                }
                throw new Error('Application not found');
            })
        );
    }

    // Job Offer CRUD Methods
    getAllJobs(): Observable<JobOffer[]> {
        console.log('Fetching all job offers...');
        return this.http.get<JobOffer[]>(this.baseJobs, this.httpOptions).pipe(
            tap((jobs) => {
                console.log('Job offers received from API:', jobs?.length);
                if (jobs && jobs.length > 0) {
                    this.mockJobOffers = jobs;
                    this.jobOffersSubject.next(this.mockJobOffers);
                    this.saveToStorage();
                } else {
                    this.jobOffersSubject.next(this.mockJobOffers);
                }
            }),
            catchError((error) => {
                console.warn('API job offers failed, returning mocks:', error.message);
                this.jobOffersSubject.next(this.mockJobOffers);
                return of(this.mockJobOffers);
            })
        );
    }

    getJobById(id: number): Observable<JobOffer> {
        return this.http.get<JobOffer>(`${this.baseJobs}/${id}`, this.httpOptions).pipe(
            catchError(() => {
                const job = this.mockJobOffers.find(j => j.id === id);
                if (job) return of(job);
                throw new Error('Offer not found');
            })
        );
    }

    createJob(job: JobOffer): Observable<JobOffer> {
        return this.http.post<JobOffer>(this.baseJobs, job, this.httpOptions).pipe(
            tap((newJob) => {
                this.mockJobOffers.push(newJob);
                this.jobOffersSubject.next(this.mockJobOffers);
                this.saveToStorage();
            }),
            catchError(() => {
                const newJob = { ...job, id: Math.max(...this.mockJobOffers.map(j => j.id), 0) + 1 };
                this.mockJobOffers.push(newJob);
                this.jobOffersSubject.next(this.mockJobOffers);
                this.saveToStorage();
                return of(newJob);
            })
        );
    }

    updateJob(id: number, job: JobOffer): Observable<JobOffer> {
        return this.http.put<JobOffer>(`${this.baseJobs}/${id}`, job, this.httpOptions).pipe(
            tap((updatedJob) => {
                const index = this.mockJobOffers.findIndex(j => j.id === id);
                if (index !== -1) {
                    this.mockJobOffers[index] = updatedJob;
                    this.jobOffersSubject.next(this.mockJobOffers);
                    this.saveToStorage();
                }
            }),
            catchError(() => {
                const index = this.mockJobOffers.findIndex(j => j.id === id);
                if (index !== -1) {
                    this.mockJobOffers[index] = { ...job, id };
                    this.jobOffersSubject.next(this.mockJobOffers);
                    this.saveToStorage();
                    return of(this.mockJobOffers[index]);
                }
                throw new Error('Offer not found');
            })
        );
    }

    deleteJob(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseJobs}/${id}`, this.httpOptions).pipe(
            tap(() => {
                this.mockJobOffers = this.mockJobOffers.filter(j => j.id !== id);
                this.jobOffersSubject.next(this.mockJobOffers);
                this.saveToStorage();
            }),
            catchError(() => {
                this.mockJobOffers = this.mockJobOffers.filter(j => j.id !== id);
                this.jobOffersSubject.next(this.mockJobOffers);
                this.saveToStorage();
                return of(void 0);
            })
        );
    }
}
