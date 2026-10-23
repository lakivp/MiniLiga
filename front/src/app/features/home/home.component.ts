import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import {
  faArrowRight,
  faCalendarDays,
  faTrophy,
  faFutbol,
  faChartLine,
  faClock
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    FontAwesomeModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  readonly icons = {
    arrow: faArrowRight,
    calendar: faCalendarDays,
    trophy: faTrophy,
    football: faFutbol,
    chart: faChartLine,
    clock: faClock
  };

  readonly quickLinks = [
    {
      number: '01',
      title: 'Raspored',
      description: 'Pogledaj naredne utakmice i termine.',
      path: '/raspored',
      icon: faCalendarDays
    },
    {
      number: '02',
      title: 'Rezultati',
      description: 'Pregled svih odigranih utakmica.',
      path: '/rezultati',
      icon: faFutbol
    },
    {
      number: '03',
      title: 'Tabela',
      description: 'Prati plasman svih ekipa u ligi.',
      path: '/tabela',
      icon: faTrophy
    },
    {
      number: '04',
      title: 'Statistika',
      description: 'Golovi, asistencije i još mnogo toga.',
      path: '/statistika',
      icon: faChartLine
    }
  ];
}