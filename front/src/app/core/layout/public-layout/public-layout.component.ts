import {
  Component
} from '@angular/core';

import {
  RouterOutlet
} from '@angular/router';

import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-public-layout',

  standalone: true,

  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent
  ],

  templateUrl: './public-layout.component.html',

  styleUrl: './public-layout.component.css'
})
export class PublicLayoutComponent {}