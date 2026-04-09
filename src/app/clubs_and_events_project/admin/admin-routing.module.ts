import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent),
    children: [
      { path: 'clubs', loadChildren: () => import('./clubs/clubs-admin.module').then(m => m.ClubsAdminModule) },
      { path: 'events', loadChildren: () => import('./events/events-admin.module').then(m => m.EventsAdminModule) },
      { path: 'spaces', loadChildren: () => import('./spaces/spaces-admin.module').then(m => m.SpacesAdminModule) },
      { path: 'event-stats/:id', loadComponent: () => import('./event-stats-dashboard/event-stats-dashboard.component').then(c => c.EventStatsDashboardComponent) }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
