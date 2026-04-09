import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BACKOFFICE_NAV } from '../../../assessment_project/app-navigation.config';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  readonly backofficeNav = BACKOFFICE_NAV;
  isLoggedIn = false;
  userRole: string = '';
  isDropdownOpen: { [key: string]: boolean } = {};

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isLoggedIn = !!user;
    this.userRole = user?.role || '';

    // Ouvrir les sections par défaut pour plus de visibilité
    this.isDropdownOpen['💼 RECRUTEMENT'] = true;
    this.isDropdownOpen['📝 EXAMENS & ÉVALS'] = true;
    this.isDropdownOpen['🎮 MODE JEU'] = true;
  }


  toggleDropdown(groupTitle: string): void {
    this.isDropdownOpen[groupTitle] = !this.isDropdownOpen[groupTitle];

    // Optional: Close other dropdowns
    Object.keys(this.isDropdownOpen).forEach(key => {
      if (key !== groupTitle) {
        this.isDropdownOpen[key] = false;
      }
    });
  }
}