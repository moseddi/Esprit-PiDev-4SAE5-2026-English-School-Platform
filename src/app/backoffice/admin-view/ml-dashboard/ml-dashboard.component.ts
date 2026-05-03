import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { MlService } from '../../../services/ml.service';
import {
  SessionInput,
  PredictionResponse,
  PredictionsMap,
  ModelResult,
  ModelMetric,
  Recommendation,
  ClusterProfile,
  FeatureImportance,
} from '../../../models/ml.models';

type Tab = 'predict' | 'metrics' | 'recommendations' | 'clusters' | 'features';

@Component({
  selector: 'app-ml-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ml-dashboard.component.html',
  styleUrls: ['./ml-dashboard.component.css'],
})
export class MlDashboardComponent implements OnInit, OnDestroy {

  // ── navigation ─────────────────────────────────────────────────────────────
  activeTab: Tab = 'predict';

  // ── server status ──────────────────────────────────────────────────────────
  serverOnline = false;
  serverChecking = true;

  // ── loading / error ────────────────────────────────────────────────────────
  loadingPredict      = false;
  loadingMetrics      = false;
  loadingRecommend    = false;
  loadingClusters     = false;
  loadingFeatures     = false;
  errorMsg            = '';

  // ── data ───────────────────────────────────────────────────────────────────
  predictionResult:   PredictionResponse | null = null;
  metrics:            Record<string, ModelMetric> = {};
  recommendations:    Recommendation[] = [];
  clusters:           ClusterProfile[] = [];
  featureImportance:  FeatureImportance[] = [];

  // ── form ───────────────────────────────────────────────────────────────────
  form: SessionInput = {
    reading_speed_wpm:           110,
    pronunciation_accuracy:       85,
    listening_score:              75,
    reading_score:                80,
    speaking_score:               70,
    engagement_level:            'High',
    emotion_state:               'Happy',
    content_type_displayed:      'Video',
    content_difficulty_level:    'Medium',
    teaching_style:              'Visual',
    device_type_used:            'Laptop',
    eye_tracking_focus_duration:  300,
    gesture_interaction_count:    10,
    adaptive_score:               75,
    student_feedback_score:        4.2,
    network_latency_ms:            45,
    sensor_error_rate:              0.5,
    teaching_experience_years:      8,
    recommendation_used:            1,
    performance_improvement_rate:  10,
  };

  // ── dropdown options ───────────────────────────────────────────────────────
  readonly engagementLevels  = ['Low', 'Medium', 'High'] as const;
  readonly emotionStates     = ['Happy', 'Bored', 'Confused', 'Focused'] as const;
  readonly contentTypes      = ['Text', 'Video', 'Quiz', 'Game'] as const;
  readonly difficultyLevels  = ['Easy', 'Medium', 'Hard'] as const;
  readonly teachingStyles    = ['Visual', 'Auditory', 'Kinesthetic', 'Mixed'] as const;
  readonly deviceTypes       = ['Laptop', 'Tablet', 'Smart Board', 'AR Glass'] as const;

  private destroy$ = new Subject<void>();

  constructor(private ml: MlService) {}

  ngOnInit(): void {
    this.checkServer();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── server health ──────────────────────────────────────────────────────────
  checkServer(): void {
    this.serverChecking = true;
    this.ml.health()
      .pipe(takeUntil(this.destroy$), finalize(() => this.serverChecking = false))
      .subscribe({
        next:  () => { this.serverOnline = true; this.loadTab(this.activeTab); },
        error: () => { this.serverOnline = false; },
      });
  }

  // ── tab switching ──────────────────────────────────────────────────────────
  setTab(tab: Tab): void {
    this.activeTab = tab;
    this.errorMsg  = '';
    this.loadTab(tab);
  }

  private loadTab(tab: Tab): void {
    if (!this.serverOnline) return;
    switch (tab) {
      case 'metrics':         if (!Object.keys(this.metrics).length)      this.loadMetrics();         break;
      case 'recommendations': if (!this.recommendations.length)           this.loadRecommendations(); break;
      case 'clusters':        if (!this.clusters.length)                  this.loadClusters();        break;
      case 'features':        if (!this.featureImportance.length)         this.loadFeatures();        break;
    }
  }

  // ── predict ────────────────────────────────────────────────────────────────
  runPredict(): void {
    this.loadingPredict   = true;
    this.predictionResult = null;
    this.errorMsg         = '';

    this.ml.predict(this.form)
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingPredict = false))
      .subscribe({
        next:  res => this.predictionResult = res,
        error: err => this.errorMsg = err.message,
      });
  }

  resetForm(): void {
    this.predictionResult = null;
    this.errorMsg         = '';
  }

  // ── metrics ────────────────────────────────────────────────────────────────
  loadMetrics(): void {
    this.loadingMetrics = true;
    this.ml.getMetrics()
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingMetrics = false))
      .subscribe({
        next:  res => this.metrics = res as any,
        error: err => this.errorMsg = err.message,
      });
  }

  // ── recommendations ────────────────────────────────────────────────────────
  loadRecommendations(): void {
    this.loadingRecommend = true;
    this.ml.getRecommendations()
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingRecommend = false))
      .subscribe({
        next:  res => this.recommendations = res,
        error: err => this.errorMsg = err.message,
      });
  }

  // ── clusters ───────────────────────────────────────────────────────────────
  loadClusters(): void {
    this.loadingClusters = true;
    this.ml.getClusters()
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingClusters = false))
      .subscribe({
        next:  res => this.clusters = res,
        error: err => this.errorMsg = err.message,
      });
  }

  // ── feature importance ─────────────────────────────────────────────────────
  loadFeatures(): void {
    this.loadingFeatures = true;
    this.ml.getFeatureImportance()
      .pipe(takeUntil(this.destroy$), finalize(() => this.loadingFeatures = false))
      .subscribe({
        next:  res => this.featureImportance = res,
        error: err => this.errorMsg = err.message,
      });
  }

  // ── helpers ────────────────────────────────────────────────────────────────
  get metricsArray(): ModelMetric[] {
    return Object.values(this.metrics);
  }

  get maxImportance(): number {
    return this.featureImportance.length
      ? Math.max(...this.featureImportance.map(f => f.importance))
      : 1;
  }

  barWidth(val: number): number {
    return Math.round((val / this.maxImportance) * 100);
  }

  metricBarWidth(val: number): number {
    return Math.round(val * 100);
  }

  probabilityColor(prob: number): string {
    if (prob >= 0.7) return '#28a745';
    if (prob >= 0.4) return '#ffc107';
    return '#dc3545';
  }

  effectivenessColor(eff: number): string {
    if (eff >= 20) return '#28a745';
    if (eff >= 10) return '#ffc107';
    return '#dc3545';
  }

  difficultyBadgeClass(d: string): string {
    return d === 'Easy' ? 'badge-easy' : d === 'Hard' ? 'badge-hard' : 'badge-medium';
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  /** Type-safe accessor for predictions map — used in template */
  getResult(key: string): ModelResult | undefined {
    if (!this.predictionResult) return undefined;
    return this.predictionResult.predictions[key];
  }

  clusterEmoji(profile: ClusterProfile): string {
    if (profile.speed_label === 'Fast reader' && profile.effectiveness >= 20) return '🚀';
    if (profile.dominant_emotion === 'Happy')   return '😊';
    if (profile.dominant_emotion === 'Focused') return '🎯';
    if (profile.dominant_emotion === 'Bored')   return '😴';
    if (profile.dominant_emotion === 'Confused') return '🤔';
    return '📚';
  }
}
