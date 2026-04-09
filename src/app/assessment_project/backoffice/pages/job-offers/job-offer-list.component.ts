import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobOffer, Level } from '../../models/application.models';
import { ApplicationService } from '../../services/application.service';

@Component({
  selector: 'app-job-offer-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">💼 Offres d'Emploi</h2>
          <p class="page-sub">Gérez vos opportunités de carrière et les niveaux requis</p>
        </div>
        <button class="btn-primary" [routerLink]="['nouveau']">
          <span class="btn-icon">+</span> Nouvelle Offre
        </button>
      </div>

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div> Chargement des offres...
        </div>
      }

      @if (!loading && jobOffers.length === 0) {
        <div class="empty-state">
          <span class="empty-icon">💼</span>
          <p>Aucune offre d'emploi active.</p>
          <button class="btn-secondary" [routerLink]="['nouveau']">Créer ma première offre</button>
        </div>
      }

      @if (!loading && jobOffers.length > 0) {
        <div class="grid-offers">
          @for (job of jobOffers; track job.id) {
            <div class="offer-card" [class.inactive]="!job.active">
              <div class="offer-status">
                <span class="status-dot" [class.active]="job.active"></span>
                {{ job.active ? 'Active' : 'Inactive' }}
              </div>
              
              <h3 class="offer-title">{{ job.title }}</h3>
              <p class="offer-desc">{{ job.description }}</p>
              
              <div class="offer-meta">
                <span class="level-badge" [class]="job.requiredLevel.toLowerCase()">
                  {{ job.requiredLevel }}
                </span>
                <span class="id-tag">#{{ job.id }}</span>
              </div>

              <div class="offer-actions">
                <button class="btn-outline edit" [routerLink]="['modifier', job.id]" title="Modifier">
                  ✏️ Modifier
                </button>
                <button class="btn-outline delete" (click)="deleteJob(job.id)" title="Supprimer">
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
    `,
  styles: [`
    .page { padding: 1rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; gap: 1rem; flex-wrap: wrap; }
    .page-title { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin: 0 0 0.25rem; }
    .page-sub { color: #64748b; margin: 0; font-size: 0.95rem; }
    
    .btn-primary { background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3); }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3); background: #2563eb; }
    .btn-icon { font-size: 1.25rem; font-weight: 400; }

    .grid-offers { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    
    .offer-card { background: white; border-radius: 20px; padding: 1.75rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); transition: all 0.3s; position: relative; display: flex; flex-direction: column; }
    .offer-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border-color: #3b82f633; }
    .offer-card.inactive { opacity: 0.7; border-style: dashed; }
    
    .offer-status { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 1rem; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
    .status-dot.active { background: #10b981; box-shadow: 0 0 0 3px #10b98122; }

    .offer-title { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0 0 0.75rem; }
    .offer-desc { color: #475569; font-size: 0.92rem; line-height: 1.6; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }

    .offer-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
    .level-badge { padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; }
    .level-badge.a1, .level-badge.a2 { background: #dcfce7; color: #166534; }
    .level-badge.b1, .level-badge.b2 { background: #fef9c3; color: #854d0e; }
    .level-badge.c1, .level-badge.c2 { background: #fee2e2; color: #991b1b; }
    .id-tag { color: #94a3b8; font-family: monospace; font-size: 0.8rem; }

    .offer-actions { display: flex; gap: 0.75rem; }
    .btn-outline { flex: 1; background: white; border: 1px solid #e2e8f0; padding: 0.6rem; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.4rem; color: #475569; }
    .btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
    .btn-outline.delete:hover { border-color: #fee2e2; color: #ef4444; background: #fff1f2; }

    .loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem; color: #64748b; }
    .spinner { width: 32px; height: 32px; border: 3px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 5rem 2rem; background: #f8fafc; border-radius: 20px; border: 2px dashed #e2e8f0; color: #64748b; }
    .btn-secondary { background: white; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 700; cursor: pointer; margin-top: 1.5rem; }
    `]
})
export class JobOfferListComponent implements OnInit {
  jobOffers: JobOffer[] = [];
  loading = true;

  constructor(private svc: ApplicationService) { }

  ngOnInit(): void {
    console.log('=== JobOfferListComponent ngOnInit ===');
    this.svc.getAllJobs().subscribe({
      next: (data) => {
        console.log('✅ Job offers loaded in component:', data?.length);
        this.jobOffers = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error loading job offers in component:', err);
        this.jobOffers = [];
        this.loading = false;
      }
    });
  }

  deleteJob(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer cette offre ?')) {
      this.svc.deleteJob(id).subscribe(() => {
        this.jobOffers = this.jobOffers.filter(j => j.id !== id);
      });
    }
  }
}
