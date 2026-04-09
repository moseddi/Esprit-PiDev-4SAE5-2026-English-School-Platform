import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Application, ApplicationStatus } from '../../models/application.models';
import { ApplicationService } from '../../services/application.service';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">📩 Candidatures</h2>
          <p class="page-sub">Gestion des candidatures aux offres d'emploi · Suivi du recrutement</p>
        </div>
        <div class="stats-badge">
          <span class="live-dot"></span>
          {{ applications.length }} Total
        </div>
      </div>

      <!-- Summary metrics -->
      @if (!loading && applications.length > 0) {
        <div class="summary-row">
          <div class="summ-card pending">
            <span class="summ-num">{{ getCount(ApplicationStatus.PENDING) }}</span>
            <span class="summ-lbl">En attente ⏳</span>
          </div>
          <div class="summ-card accepted">
            <span class="summ-num">{{ getCount(ApplicationStatus.ACCEPTED) }}</span>
            <span class="summ-lbl">Acceptées ✅</span>
          </div>
          <div class="summ-card rejected">
            <span class="summ-num">{{ getCount(ApplicationStatus.REJECTED) }}</span>
            <span class="summ-lbl">Refusées ❌</span>
          </div>
        </div>
      }

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div> Chargement des candidatures...
        </div>
      }

      @if (!loading && applications.length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📩</span>
          <p>Aucune candidature trouvée.</p>
        </div>
      }

      @if (!loading && applications.length > 0) {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Utilisateur</th>
                <th>Offre d'emploi</th>
                <th>Niveau Requis</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (app of applications; track app.id) {
                <tr>
                  <td class="id-cell">#{{ app.id }}</td>
                  <td>
                    <div class="user-info">
                      <span class="user-avatar">👤</span>
                      <div class="user-details">
                        <span class="user-name">Utilisateur #{{ app.userId }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="job-info">
                      <span class="job-title">{{ app.jobOffer.title }}</span>
                      <span class="job-id">Offre #{{ app.jobOffer.id }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="level-badge" [class]="app.jobOffer.requiredLevel.toLowerCase()">
                      {{ app.jobOffer.requiredLevel }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="app.status.toLowerCase()">
                      {{ getStatusLabel(app.status) }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    @if (app.status === ApplicationStatus.PENDING) {
                      <div class="action-buttons">
                        <button class="btn-action accept" (click)="updateStatus(app.id, ApplicationStatus.ACCEPTED)" title="Accepter">
                          ✅
                        </button>
                        <button class="btn-action reject" (click)="updateStatus(app.id, ApplicationStatus.REJECTED)" title="Refuser">
                          ❌
                        </button>
                      </div>
                    } @else {
                      <span class="completed-text">
                        Traité
                      </span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
    `,
  styles: [`
    .page { padding: 1rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
    .page-title { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin: 0 0 0.25rem; }
    .page-sub { color: #64748b; margin: 0; font-size: 0.95rem; }
    
    .stats-badge { display: flex; align-items: center; gap: 0.6rem; background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; padding: 0.5rem 1.25rem; border-radius: 99px; font-size: 0.85rem; font-weight: 700; }
    .live-dot { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }

    .summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .summ-card { background: #fff; border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #f1f5f9; transition: transform 0.2s; }
    .summ-card:hover { transform: translateY(-2px); }
    .summ-num { font-size: 2.25rem; font-weight: 800; line-height: 1; }
    .summ-lbl { font-size: 0.85rem; color: #64748b; margin-top: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; }
    
    .pending .summ-num { color: #f59e0b; }
    .accepted .summ-num { color: #10b981; }
    .rejected .summ-num { color: #ef4444; }

    .loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem; color: #64748b; font-weight: 500; }
    .spinner { width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 5rem 2rem; background: #f8fafc; border-radius: 20px; border: 2px dashed #e2e8f0; color: #64748b; }
    .empty-icon { font-size: 4rem; display: block; margin-bottom: 1.5rem; filter: grayscale(1); opacity: 0.5; }

    .table-wrap { background: #fff; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table thead { background: #f8fafc; border-bottom: 2px solid #f1f5f9; }
    .data-table th { padding: 1.25rem 1.5rem; text-align: left; font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .data-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; color: #334155; vertical-align: middle; }
    .data-table tbody tr:hover { background: #fcfdfe; }
    
    .id-cell { color: #94a3b8; font-family: monospace; font-weight: 600; }
    
    .user-info { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar { width: 32px; height: 32px; background: #eff6ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
    .user-name { font-weight: 600; display: block; }

    .job-info { display: flex; flex-direction: column; gap: 0.1rem; }
    .job-title { font-weight: 700; color: #1e293b; }
    .job-id { font-size: 0.75rem; color: #94a3b8; }

    .level-badge { padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
    .level-badge.a1, .level-badge.a2 { background: #dcfce7; color: #166534; }
    .level-badge.b1, .level-badge.b2 { background: #fef9c3; color: #854d0e; }
    .level-badge.c1, .level-badge.c2 { background: #fee2e2; color: #991b1b; }

    .status-badge { padding: 0.4rem 0.75rem; border-radius: 99px; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.accepted { background: #dcfce7; color: #166534; }
    .status-badge.rejected { background: #fee2e2; color: #991b1b; }

    .actions-cell { min-width: 120px; }
    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-action { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .btn-action:hover { transform: scale(1.1); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .btn-action.accept:hover { background: #10b981; border-color: #10b981; }
    .btn-action.reject:hover { background: #ef4444; border-color: #ef4444; }
    
    .completed-text { font-size: 0.8rem; font-weight: 600; color: #94a3b8; font-style: italic; }
  `]
})
export class ApplicationListComponent implements OnInit {
  applications: Application[] = [];
  loading = true;
  ApplicationStatus = ApplicationStatus;

  constructor(private svc: ApplicationService) { }

  ngOnInit(): void {
    this.svc.getAll().subscribe({
      next: data => {
        this.applications = data;
        this.loading = false;
      },
      error: () => {
        this.applications = [];
        this.loading = false;
      }
    });
  }

  getCount(status: ApplicationStatus): number {
    return this.applications.filter(a => a.status === status).length;
  }

  getStatusLabel(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.PENDING: return 'En attente';
      case ApplicationStatus.ACCEPTED: return 'Accepté';
      case ApplicationStatus.REJECTED: return 'Refusé';
      default: return status;
    }
  }

  updateStatus(id: number, status: ApplicationStatus): void {
    this.svc.updateStatus(id, status).subscribe(() => {
      const index = this.applications.findIndex(a => a.id === id);
      if (index !== -1) {
        this.applications[index].status = status;
      }
    });
  }
}
