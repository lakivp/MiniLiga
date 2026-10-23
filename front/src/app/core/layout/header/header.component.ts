
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBars,
  faXmark,
  faFutbol,
  faChevronDown,
  faUserShield
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    FontAwesomeModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  menuOpen = false;

  readonly icons = {
    bars: faBars,
    close: faXmark,
    football: faFutbol,
    chevronDown: faChevronDown,
    admin: faUserShield
  };

  readonly navItems = [
    { label: 'Početna', path: '/' },
    { label: 'Raspored', path: '/raspored' },
    { label: 'Rezultati', path: '/rezultati' },
    { label: 'Tabela', path: '/tabela' },
    { label: 'Statistika', path: '/statistika' },
    { label: 'Vesti', path: '/news' },
    { label: 'Kontakt', path: '/kontakt' }
  ];

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }
}