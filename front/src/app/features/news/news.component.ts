import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  AdminNewsService,
  News
} from '../../services/admin-news.service';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './news.component.html',
  styleUrl: './news.component.css'
})
export class NewsComponent implements OnInit {

  news: News[] = [];

  readonly pageSize = 9;

  currentPage = 1;

  loading = false;
  errorMessage = '';

  constructor(
    private newsService: AdminNewsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNews();
  }

  /**
   * Učitavanje svih vesti.
   */
  loadNews(): void {

    this.loading = true;
    this.errorMessage = '';

    this.newsService.getAll().subscribe({

      next: (response) => {

        this.news = response;
        this.currentPage = 1;

        this.loading = false;
      },

      error: (error) => {

        console.error(
          'Greška prilikom učitavanja vesti:',
          error
        );

        this.errorMessage =
          'Vesti trenutno nije moguće učitati.';

        this.loading = false;
      }

    });
  }

  get paginatedNews(): News[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.news.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.news.length / this.pageSize);
  }



  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  
  get paginationItems(): (number | 'ellipsis')[] {
    return this.getPaginationItems(
      this.totalPages,
      this.currentPage
    );
  }

  private getPaginationItems(
    totalPages: number,
    currentPage: number
  ): (number | 'ellipsis')[] {
    if (totalPages <= 3) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    // Početak: 1 2 3 ... poslednja
    if (currentPage <= 2) {
      return [1, 2, 3, 'ellipsis', totalPages];
    }

    // Kraj: prva ... poslednje tri stranice
    if (currentPage >= totalPages - 1) {
      return [
        1,
        'ellipsis',
        totalPages - 2,
        totalPages - 1,
        totalPages
      ];
    }

    // Sredina: prva ... prethodna, trenutna, sledeća ... poslednja
    return [
      1,
      'ellipsis',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'ellipsis',
      totalPages
    ];
  }


  /**
   * Otvara detalje vesti.
   */
  openNews(id: number): void {

    this.router.navigate([
      '/news',
      id
    ]);
  }

  /**
   * Vraća punu URL adresu slike.
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
   * Skraćeni tekst za karticu.
   */
  getShortContent(
    content: string
  ): string {

    const maxLength = 170;

    if (content.length <= maxLength) {
      return content;
    }

    return (
      content.substring(0, maxLength).trim() +
      '...'
    );
  }

  /**
   * Format datuma.
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