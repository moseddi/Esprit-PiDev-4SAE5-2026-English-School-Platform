import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApplicationService } from '../../../services/application.service';
import { JobOffer, Level } from '../../../models/application.models';

@Component({
  selector: 'app-job-offer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <!-- Toast Notification -->
      @if (toast) {
        <div class="toast" [class.toast-success]="toast.type === 'success'" [class.toast-error]="toast.type === 'error'">
          <span class="toast-icon">{{ toast.type === 'success' ? '✅' : '❌' }}</span>
          {{ toast.message }}
        </div>
      }

      <div class="page-header">
        <div>
          <h2 class="page-title">{{ isEdit ? '✏️ Edit Job Offer' : '🆕 Create Job Offer' }}</h2>
          <p class="page-sub">{{ isEdit ? 'Update the details of this job offer.' : 'Fill in the details to publish a new job opportunity.' }}</p>
        </div>
        <button class="btn-back" [routerLink]="['/backoffice/admin/job-offers']">← Back to list</button>
      </div>

      @if (pageLoading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading offer...</p>
        </div>
      } @else {
        <div class="form-container">
          <form #offerForm="ngForm" (ngSubmit)="save()" class="glass-form">

            <!-- ── 1. Title ─────────────────────────────────────── -->
            <div class="section-title">📝 General Information</div>

            <div class="form-group" [class.has-error]="titleField.touched && titleField.invalid">
              <label for="title">
                <span class="label-icon">🏷️</span>
                Title <span class="required">*</span>
              </label>
              <input
                type="text" id="title" name="title"
                #titleField="ngModel"
                [(ngModel)]="offer.title"
                required minlength="3" maxlength="120"
                placeholder="Ex: Senior Full-Stack Developer..."
                class="form-input">
              @if (titleField.touched && titleField.errors?.['required']) {
                <span class="error-msg">Title is required.</span>
              }
              @if (titleField.touched && titleField.errors?.['minlength']) {
                <span class="error-msg">Title must be at least 3 characters.</span>
              }
            </div>

            <!-- ── 2. Description ──────────────────────────────── -->
            <div class="form-group" [class.has-error]="descField.touched && descField.invalid">
              <label for="description">
                <span class="label-icon">📄</span>
                Description <span class="required">*</span>
              </label>
              <textarea
                id="description" name="description"
                #descField="ngModel"
                [(ngModel)]="offer.description"
                required minlength="10"
                placeholder="Describe the position, responsibilities and required skills..."
                rows="5"
                class="form-input">
              </textarea>
              @if (descField.touched && descField.errors?.['required']) {
                <span class="error-msg">Description is required.</span>
              }
            </div>

            <!-- ── 3. Required Level ───────────────────────────── -->
            <div class="form-group">
              <label for="requiredLevel">
                <span class="label-icon">🎓</span>
                Required Level
              </label>
              <select id="requiredLevel" name="requiredLevel" [(ngModel)]="offer.requiredLevel" class="form-input">
                <option [ngValue]="undefined">— Select a level —</option>
                @for (lvl of levels; track lvl) {
                  <option [value]="lvl">{{ getLevelLabel(lvl) }}</option>
                }
              </select>
              @if (offer.requiredLevel) {
                <div class="level-badge-preview" [class]="'preview-' + offer.requiredLevel.toLowerCase()">
                  Selected: <strong>{{ getLevelLabel(offer.requiredLevel) }}</strong>
                </div>
              }
            </div>

            <div class="section-title">🏢 Company & Location</div>

            <div class="form-row">
              <!-- ── 4. Company Name ────────────────────────────── -->
              <div class="form-group">
                <label for="companyName">
                  <span class="label-icon">🏢</span>
                  Company Name
                </label>
                <input
                  type="text" id="companyName" name="companyName"
                  [(ngModel)]="offer.companyName"
                  placeholder="Ex: TechCorp"
                  class="form-input">
              </div>

              <!-- ── 5. Location ────────────────────────────────── -->
              <div class="form-group">
                <label for="location">
                  <span class="label-icon">📍</span>
                  Location
                </label>
                <input
                  type="text" id="location" name="location"
                  [(ngModel)]="offer.location"
                  placeholder="Ex: Paris, Remote..."
                  class="form-input">
              </div>
            </div>

            <div class="section-title">📋 Contract Details</div>

            <div class="form-row">
              <!-- ── 6. Contract Type ───────────────────────────── -->
              <div class="form-group">
                <label for="contractType">
                  <span class="label-icon">📝</span>
                  Contract Type
                </label>
                <select id="contractType" name="contractType" [(ngModel)]="offer.contractType" class="form-input">
                  <option [ngValue]="undefined">— Select a type —</option>
                  <option value="CDI">CDI – Permanent</option>
                  <option value="CDD">CDD – Fixed-term</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Stage">Internship</option>
                  <option value="Alternance">Apprenticeship</option>
                </select>
              </div>

              <!-- ── 7. Salary ──────────────────────────────────── -->
              <div class="form-group">
                <label for="salary">
                  <span class="label-icon">💰</span>
                  Salary (optional)
                </label>
                <div class="input-prefix-wrap">
                  <span class="input-prefix">$</span>
                  <input
                    type="number" id="salary" name="salary"
                    [(ngModel)]="offer.salary"
                    placeholder="Ex: 45000"
                    min="0"
                    class="form-input pl-prefix">
                </div>
              </div>
            </div>

            <div class="section-title">📡 Publication & Status</div>

            <div class="form-row">
              <!-- ── 8. Status ──────────────────────────────────── -->
              <div class="form-group">
                <label for="status">
                  <span class="label-icon">🏷️</span>
                  Status
                </label>
                <select id="status" name="status" [(ngModel)]="offer.status" class="form-input">
                  <option [ngValue]="undefined">— Select a status —</option>
                  <option value="DRAFT">📝 Draft</option>
                  <option value="PUBLISHED">🟢 Published</option>
                  <option value="CLOSED">🔴 Closed</option>
                </select>
                @if (offer.status) {
                  <div class="status-preview" [class]="'status-' + offer.status.toLowerCase()">
                    {{ getStatusLabel(offer.status) }}
                  </div>
                }
              </div>

              <!-- ── Active toggle ──────────────────────────────── -->
              <div class="form-group">
                <label><span class="label-icon">👁️</span> Visibility</label>
                <div class="toggle-card" [class.toggle-active]="offer.active" (click)="offer.active = !offer.active">
                  <div class="toggle-track">
                    <div class="toggle-thumb"></div>
                  </div>
                  <div class="toggle-info">
                    <span class="toggle-title">{{ offer.active ? '🟢 Active Offer' : '⚫ Inactive Offer' }}</span>
                    <span class="toggle-sub">{{ offer.active ? 'Visible to candidates' : 'Hidden from candidates' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-row">
              <!-- ── 9. Publication Date ────────────────────────── -->
              <div class="form-group">
                <label for="publicationDate">
                  <span class="label-icon">📅</span>
                  Publication Date
                </label>
                <input
                  type="date" id="publicationDate" name="publicationDate"
                  [(ngModel)]="offer.publicationDate"
                  class="form-input">
              </div>

              <!-- ── 10. Expiration Date ────────────────────────── -->
              <div class="form-group">
                <label for="expirationDate">
                  <span class="label-icon">⏳</span>
                  Expiration Date
                </label>
                <input
                  type="date" id="expirationDate" name="expirationDate"
                  [(ngModel)]="offer.expirationDate"
                  class="form-input">
                @if (offer.publicationDate && offer.expirationDate && offer.expirationDate < offer.publicationDate) {
                  <span class="error-msg">Expiration must be after publication date.</span>
                }
              </div>
            </div>

            <!-- ── Actions ────────────────────────────────────── -->
            <div class="form-actions">
              <button type="button" class="btn-cancel" [routerLink]="['/backoffice/admin/job-offers']">Cancel</button>
              <button type="submit" [disabled]="!offerForm.form.valid || loading" class="btn-save">
                @if (loading) {
                  <span class="btn-spinner"></span> Saving...
                } @else {
                  💾 {{ isEdit ? 'Update Offer' : 'Create Offer' }}
                }
              </button>
            </div>

          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * { box-sizing: border-box; }
    .page { padding: 2rem; max-width: 860px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }

    /* ── Toast ─────────────────────────────────────────────── */
    .toast { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; border-radius: 14px; font-weight: 600; font-size: 0.9rem; box-shadow: 0 20px 40px rgba(0,0,0,0.15); animation: slideIn 0.3s ease; }
    .toast-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .toast-error   { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
    .toast-icon { font-size: 1.1rem; }
    @keyframes slideIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    /* ── Header ────────────────────────────────────────────── */
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
    .page-title  { font-size: 1.8rem; font-weight: 800; color: #1e293b; margin: 0 0 0.3rem; }
    .page-sub    { color: #64748b; font-size: 0.95rem; margin: 0; }
    .btn-back { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.6rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; color: #475569; text-decoration: none; display: inline-block; }
    .btn-back:hover { background: white; transform: translateX(-3px); border-color: #cbd5e1; }

    /* ── Loading ────────────────────────────────────────────── */
    .loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem; color: #64748b; }
    .spinner { width: 36px; height: 36px; border: 3px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Form container ─────────────────────────────────────── */
    .glass-form {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 2.5rem;
      border-radius: 24px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      gap: 1.4rem;
    }

    .section-title {
      font-size: 0.95rem;
      font-weight: 800;
      color: #3b82f6;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      border-bottom: 2px solid #eff6ff;
      padding-bottom: 0.5rem;
      margin-top: 0.5rem;
    }

    /* ── Form groups ────────────────────────────────────────── */
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group label { font-size: 0.85rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 0.4rem; }
    .label-icon { font-size: 1rem; }
    .required { color: #ef4444; }

    .form-input {
      padding: 0.85rem 1rem;
      border-radius: 10px;
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      font-size: 0.95rem;
      color: #1e293b;
      transition: all 0.2s;
      font-family: inherit;
      width: 100%;
    }
    .form-input:focus { outline: none; border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); }
    textarea.form-input { resize: vertical; min-height: 120px; }
    .has-error .form-input { border-color: #fca5a5; background: #fff5f5; }
    .error-msg { font-size: 0.78rem; color: #ef4444; font-weight: 600; }

    /* ── Row layout ─────────────────────────────────────────── */
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    @media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }

    /* ── Salary prefix ──────────────────────────────────────── */
    .input-prefix-wrap { position: relative; }
    .input-prefix { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: #64748b; font-weight: 600; font-size: 0.95rem; pointer-events: none; }
    .pl-prefix { padding-left: 2rem; }

    /* ── Level preview ──────────────────────────────────────── */
    .level-badge-preview { padding: 0.45rem 0.9rem; border-radius: 8px; font-size: 0.82rem; font-weight: 700; margin-top: 0.4rem; display: inline-block; }
    .preview-beginner     { background: #dcfce7; color: #166534; }
    .preview-intermediate { background: #fef9c3; color: #854d0e; }
    .preview-advanced     { background: #ffedd5; color: #9a3412; }
    .preview-expert       { background: #fee2e2; color: #991b1b; }

    /* ── Status preview ─────────────────────────────────────── */
    .status-preview { padding: 0.4rem 0.85rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; margin-top: 0.4rem; display: inline-block; }
    .status-draft     { background: #f1f5f9; color: #475569; }
    .status-published { background: #dcfce7; color: #166534; }
    .status-closed    { background: #fee2e2; color: #991b1b; }

    /* ── Toggle (active / inactive) ─────────────────────────── */
    .toggle-card { display: flex; align-items: center; gap: 1rem; padding: 0.85rem 1.15rem; border: 1.5px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.25s; background: #f8fafc; user-select: none; margin-top: 0.25rem; }
    .toggle-card:hover { border-color: #cbd5e1; background: white; }
    .toggle-card.toggle-active { border-color: #86efac; background: #f0fdf4; }
    .toggle-track { width: 44px; height: 24px; border-radius: 12px; background: #e2e8f0; position: relative; transition: background 0.3s; flex-shrink: 0; }
    .toggle-active .toggle-track { background: #10b981; }
    .toggle-thumb { width: 18px; height: 18px; border-radius: 50%; background: white; position: absolute; top: 3px; left: 3px; transition: left 0.3s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
    .toggle-active .toggle-thumb { left: 23px; }
    .toggle-info { display: flex; flex-direction: column; gap: 0.1rem; }
    .toggle-title { font-size: 0.9rem; font-weight: 700; color: #1e293b; }
    .toggle-sub   { font-size: 0.78rem; color: #64748b; }

    /* ── Actions ────────────────────────────────────────────── */
    .form-actions { display: flex; gap: 1rem; justify-content: flex-end; padding-top: 1.25rem; border-top: 1px solid #f1f5f9; margin-top: 0.5rem; }
    .btn-cancel { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.85rem 1.5rem; border-radius: 10px; font-weight: 600; font-size: 0.95rem; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .btn-cancel:hover { background: #f1f5f9; color: #334155; border-color: #cbd5e1; }
    .btn-save { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 0.85rem 2.5rem; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.25s; box-shadow: 0 4px 12px rgba(59,130,246,0.3); display: flex; align-items: center; gap: 0.5rem; }
    .btn-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59,130,246,0.4); }
    .btn-save:disabled { background: #94a3b8; box-shadow: none; cursor: not-allowed; }
    .btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
  `]
})
export class JobOfferFormComponent implements OnInit {
  isEdit      = false;
  loading     = false;
  pageLoading = false;
  toast: { message: string; type: 'success' | 'error' } | null = null;

  offer: JobOffer = {
    title:           '',
    description:     '',
    requiredLevel:   undefined,
    companyName:     '',
    location:        '',
    contractType:    undefined,
    salary:          undefined,
    status:          undefined,
    publicationDate: '',
    expirationDate:  '',
    active:          true,
  };

  levels: Level[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

  constructor(
    private svc: ApplicationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  getLevelLabel(level: Level): string {
    const map: Record<Level, string> = {
      BEGINNER:     'Beginner (A1–A2)',
      INTERMEDIATE: 'Intermediate (B1–B2)',
      ADVANCED:     'Advanced (C1)',
      EXPERT:       'Expert (C2)',
    };
    return map[level] ?? level;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT:     '📝 Draft',
      PUBLISHED: '🟢 Published',
      CLOSED:    '🔴 Closed',
    };
    return map[status] ?? status;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit     = true;
      this.pageLoading = true;
      this.svc.getJobById(+id).subscribe({
        next: (data: JobOffer) => {
          this.offer       = { ...data };
          this.pageLoading = false;
        },
        error: () => {
          this.showToast('Unable to load the offer.', 'error');
          setTimeout(() => this.router.navigate(['/backoffice/admin/job-offers']), 2000);
        }
      });
    }
  }

  save(): void {
    this.loading = true;
    const action = this.isEdit && this.offer.id
      ? this.svc.updateJob(this.offer.id, this.offer)
      : this.svc.createJob(this.offer);

    action.subscribe({
      next: () => {
        this.loading = false;
        this.showToast(
          this.isEdit ? 'Offer updated successfully!' : 'Offer created successfully!',
          'success'
        );
        setTimeout(() => this.router.navigate(['/backoffice/admin/job-offers']), 1500);
      },
      error: () => {
        this.loading = false;
        this.showToast('An error occurred while saving.', 'error');
      }
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    setTimeout(() => this.toast = null, 4000);
  }
}
