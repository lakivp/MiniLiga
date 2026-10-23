import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  AdminNewsService,
  News
} from '../../services/admin-news.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-news-details',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './news-details.component.html',
  styleUrl: './news-details.component.css'
})
export class NewsDetailsComponent implements OnInit {

  news: News | null = null;

  loading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private newsService: AdminNewsService
  ) {}

  ngOnInit(): void {

    const id =
      Number(
        this.route.snapshot.paramMap.get('id')
      );

    if (!id || id <= 0) {

      this.errorMessage =
        'Vest nije pronađena.';

      return;
    }

    this.loadNews(id);
  }

  /**
   * Učitavanje konkretne vesti.
   */
  loadNews(id: number): void {

    this.loading = true;
    this.errorMessage = '';

    this.newsService
      .getById(id)
      .subscribe({

        next: (response) => {

          this.news = response;

          this.loading = false;

          /*
           * Vraćamo stranicu na vrh
           * kada se otvori vest.
           */
          window.scrollTo({
            top: 0,
            behavior: 'instant'
          });
        },

        error: (error) => {

          console.error(
            'Greška prilikom učitavanja vesti:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'Vest nije pronađena.';

          this.loading = false;
        }

      });
  }

  /**
   * Vraćanje na listu vesti.
   */
  goBack(): void {

    this.router.navigate([
      '/news'
    ]);
  }

  /**
   * URL slike.
   */
  getImageUrl(
    imageUrl: string
  ): string {

    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://')
    ) {
      return imageUrl;
    }

    return `${environment.apiUrl.replace('/api', '')}${imageUrl}`;
  }

  /**
   * Formatiranje datuma.
   */
  formatDate(
    date: string
  ): string {

    return new Intl.DateTimeFormat(
      'sr-RS',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }
    ).format(
      new Date(date)
    );
  }
}