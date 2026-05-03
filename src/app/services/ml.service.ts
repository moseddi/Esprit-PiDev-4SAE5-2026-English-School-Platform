import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import {
  SessionInput,
  PredictionResponse,
  MetricsResponse,
  Recommendation,
  ClusterProfile,
  FeatureImportance,
  BatchPredictResponse,
} from '../models/ml.models';

@Injectable({ providedIn: 'root' })
export class MlService {

  /** Flask API base URL — change port if needed */
  private readonly base = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  // ── health ────────────────────────────────────────────────────────────────
  health(): Observable<{ status: string; models_loaded: boolean; xgboost_available: boolean }> {
    return this.http.get<any>(`${this.base}/health`).pipe(
      catchError(this.handleError)
    );
  }

  // ── predict ───────────────────────────────────────────────────────────────
  predict(session: SessionInput): Observable<PredictionResponse> {
    return this.http.post<PredictionResponse>(`${this.base}/api/predict`, session).pipe(
      catchError(this.handleError)
    );
  }

  // ── batch predict ─────────────────────────────────────────────────────────
  batchPredict(sessions: Partial<SessionInput>[]): Observable<BatchPredictResponse> {
    return this.http.post<BatchPredictResponse>(
      `${this.base}/api/batch-predict`, { sessions }
    ).pipe(catchError(this.handleError));
  }

  // ── metrics ───────────────────────────────────────────────────────────────
  getMetrics(): Observable<MetricsResponse> {
    return this.http.get<MetricsResponse>(`${this.base}/api/metrics`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // ── recommendations ───────────────────────────────────────────────────────
  getRecommendations(): Observable<Recommendation[]> {
    return this.http.get<Recommendation[]>(`${this.base}/api/recommendations`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // ── clusters ──────────────────────────────────────────────────────────────
  getClusters(): Observable<ClusterProfile[]> {
    return this.http.get<ClusterProfile[]>(`${this.base}/api/clusters`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // ── feature importance ────────────────────────────────────────────────────
  getFeatureImportance(): Observable<FeatureImportance[]> {
    return this.http.get<FeatureImportance[]>(`${this.base}/api/feature-importance`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // ── error handler ─────────────────────────────────────────────────────────
  private handleError(err: HttpErrorResponse) {
    let msg = 'An unknown error occurred';
    if (err.status === 0) {
      msg = 'Cannot reach the ML server. Make sure Flask is running on port 5000.';
    } else if (err.status === 503) {
      msg = 'ML models are still loading. Please wait a moment and retry.';
    } else if (err.error?.error) {
      msg = err.error.error;
    }
    return throwError(() => new Error(msg));
  }
}
