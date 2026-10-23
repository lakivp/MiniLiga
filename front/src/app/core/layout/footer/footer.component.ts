import { Component, HostListener } from '@angular/core';

import { RouterLink } from '@angular/router';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import {
  faFutbol,
  faEnvelope,
  faPhone,
  faArrowUp
} from '@fortawesome/free-solid-svg-icons';

import {
  faInstagram
} from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    RouterLink,
    FontAwesomeModule
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

  showScrollTop = false;

  readonly icons = {
    football: faFutbol,
    email: faEnvelope,
    phone: faPhone,
    instagram: faInstagram,
    arrowUp: faArrowUp
  };

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showScrollTop = window.scrollY > 300;
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  readonly currentYear = new Date().getFullYear();
}