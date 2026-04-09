import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApplicationService } from '../../services/application.service';
import { JobOffer, Level } from '../../models/application.models';

@Component({
  selector: 'app-job-offer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page full-h">
      <div class="page-header flex justify-between items-center mb-6">
        <div>
          <h2 class="page-title">{{ isEdit ? '✏️ Edit Job Offer' : '🆕 Create Job Offer' }}</h2>
          <p class="page-sub">Fill in the details to publish a new job opportunity.</p>
        </div>
        <button class="btn-back" [routerLink]="['/backoffice/job-offers']">↩ Back to list</button>
      </div>

      <div class="form-container">
        <form #offerForm="ngForm" (ngSubmit)="save()" class="glass-form shadow-xl">
          <div class="form-grid grid gap-6 md:grid-cols-2">
            <!-- Offre Title -->
            <div class="form-group col-span-2">
              <label for="title">Job Title</label>
              <input type="text" id="title" name="title" [(ngModel)]="offer.title" required 
                     placeholder="Ex: Senior Full-Stack Developer..." class="form-input">
            </div>

            <!-- Description -->
            <div class="form-group col-span-2">
              <label for="description">Description</label>
              <textarea id="description" name="description" [(ngModel)]="offer.description" required 
                        placeholder="What are the details of this position?" rows="5" class="form-input"></textarea>
            </div>

            <!-- Level Selection -->
            <div class="form-group">
              <label for="level">Required Level (CEFR)</label>
              <select id="level" name="level" [(ngModel)]="offer.requiredLevel" required class="form-input">
                @for (lvl of levels; track lvl) {
                  <option [value]="lvl">{{ lvl }}</option>
                }
              </select>
            </div>

            <!-- Active Status -->
            <div class="form-group flex items-center gap-4 mt-6">
              <input type="checkbox" id="active" name="active" [(ngModel)]="offer.active" class="toggle-switch">
              <label for="active" class="cursor-pointer mb-0">Publish offer immediately</label>
            </div>
          </div>

          <div class="form-actions mt-8 pt-6 border-t border-slate-100 flex gap-4">
            <button type="submit" [disabled]="!offerForm.form.valid || loading" class="btn-save flex-1">
              {{ loading ? 'Saving...' : '💾 Save' }}
            </button>
            <button type="button" class="btn-cancel" [routerLink]="['/backoffice/job-offers']">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 1.5rem; max-width: 900px; margin: 0 auto; }
    .page-title { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin: 0 0 0.25rem; }
    .page-sub { color: #64748b; font-size: 0.95rem; margin: 0; }
    
    .btn-back { background: white; border: 1px solid #e2e8f0; padding: 0.6rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; color: #475569; }
    .btn-back:hover { background: #f8fafc; transform: translateX(-4px); border-color: #cbd5e1; }

    .form-container { margin-top: 1rem; perspective: 1000px; }
    .glass-form { background: rgba(255, 255, 255, 0.95); border: 1px solid #f1f5f9; padding: 2.5rem; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); backdrop-filter: blur(8px); }
    
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-size: 0.9rem; font-weight: 700; color: #1e293b; letter-spacing: 0.025em; }
    
    .form-input { padding: 0.85rem 1.15rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; font-size: 1rem; color: #1e293b; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .form-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); background: #fff; }
    
    .toggle-switch { width: 1.25rem; height: 1.25rem; cursor: pointer; border-radius: 4px; border: 2px solid #3b82f6; }

    .btn-save { background: #3b82f6; color: white; border: none; padding: 1rem 2rem; border-radius: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4); font-size: 1rem; }
    .btn-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.4); background: #2563eb; }
    .btn-save:disabled { background: #94a3b8; box-shadow: none; cursor: not-allowed; opacity: 0.7; }

    .btn-cancel { background: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem 1.5rem; border-radius: 14px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .btn-cancel:hover { background: #f1f5f9; color: #334155; border-color: #cbd5e1; }
  `]
})
export class JobOfferFormComponent implements OnInit {
  isEdit = false;
  loading = false;
  offer: JobOffer = {
    id: 0,
    title: '',
    description: '',
    requiredLevel: Level.A1,
    active: true
  };

  levels = Object.values(Level);

  constructor(
    private svc: ApplicationService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.loading = true;
      this.svc.getJobById(+id).subscribe({
        next: (data) => {
          this.offer = { ...data };
          this.loading = false;
        },
        error: () => {
          alert('Could not load the offer.');
          this.router.navigate(['/backoffice/job-offers']);
        }
      });
    }
  }

  save(): void {
    this.loading = true;
    const action = this.isEdit
      ? this.svc.updateJob(this.offer.id, this.offer)
      : this.svc.createJob(this.offer);

    action.subscribe({
      next: () => {
        alert(this.isEdit ? 'Offer updated!' : 'Offer created successfully!');
        this.router.navigate(['/backoffice/job-offers']);
      },
      error: () => {
        alert('An error occurred while saving.');
        this.loading = false;
      }
    });
  }
}
