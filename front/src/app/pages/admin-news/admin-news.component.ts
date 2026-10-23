import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

import {
  AdminNewsService,
  News
} from '../../services/admin-news.service';

@Component({
  selector: 'app-admin-news',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-news.component.html',
  styleUrl: './admin-news.component.css'
})
export class AdminNewsComponent implements OnInit {

  news: News[] = [];

  readonly pageSize = 9;

  currentPage = 1;

  loading = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  isFormVisible = false;
  isEditMode = false;

  selectedNewsId: number | null = null;

  deleteModalVisible = false;
  newsToDelete: News | null = null;
  deleting = false;

  title = '';
  content = '';

  selectedImage: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private newsService: AdminNewsService
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
        this.currentPage = Math.min(
          this.currentPage,
          Math.max(1, this.totalPages)
        );

        this.loading = false;
      },

      error: (error) => {

        console.error(
          'Greška prilikom učitavanja vesti:',
          error
        );

        this.errorMessage =
          'Vesti nije moguće učitati.';

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
    const total = this.totalPages;
    const current = this.currentPage;

    // Ako postoje najviše tri stranice, prikaži sve.
    if (total <= 3) {
      return Array.from(
        { length: total },
        (_, index) => index + 1
      );
    }

    // Na početku: 1 2 3 ... poslednja
    if (current <= 2) {
      return [1, 2, 3, 'ellipsis', total];
    }

    // Na kraju: prva ... poslednje tri stranice
    if (current >= total - 1) {
      return [
        1,
        'ellipsis',
        total - 2,
        total - 1,
        total
      ];
    }

    // U sredini: prva ... prethodna trenutna sledeća ... poslednja
    return [
      1,
      'ellipsis',
      current - 1,
      current,
      current + 1,
      'ellipsis',
      total
    ];
  }


  /**
   * Otvara formu za dodavanje nove vesti.
   */
  openAddForm(): void {

    this.resetForm();

    this.isEditMode = false;
    this.isFormVisible = true;
  }

  /**
   * Otvara formu za izmenu postojeće vesti.
   */
  openEditForm(item: News): void {

    this.isEditMode = true;
    this.isFormVisible = true;

    this.selectedNewsId = item.id;

    this.title = item.title;
    this.content = item.content;

    this.selectedImage = null;

    if (item.imageUrl) {
      this.imagePreview = this.getImageUrl(
        item.imageUrl
      );
    } else {
      this.imagePreview = null;
    }

    this.errorMessage = '';
    this.successMessage = '';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Zatvara formu.
   */
  closeForm(): void {

    this.isFormVisible = false;

    this.resetForm();
  }

  /**
   * Reset forme.
   */
  resetForm(): void {

    this.selectedNewsId = null;

    this.title = '';
    this.content = '';

    this.selectedImage = null;
    this.imagePreview = null;

    this.errorMessage = '';
    this.successMessage = '';

    this.isEditMode = false;
  }

  /**
   * Obrada izabrane slike.
   */
  onImageSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }

    const file = input.files[0];

    this.selectedImage = file;

    this.errorMessage = '';

    /*
     * Provera tipa slike.
     */
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {

      this.errorMessage =
        'Dozvoljene su JPG, PNG i WEBP slike.';

      this.selectedImage = null;
      this.imagePreview = null;

      input.value = '';

      return;
    }

    /*
     * Maksimalna veličina 5 MB.
     */
    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {

      this.errorMessage =
        'Slika ne sme biti veća od 5 MB.';

      this.selectedImage = null;
      this.imagePreview = null;

      input.value = '';

      return;
    }

    /*
     * Preview slike.
     */
    const reader = new FileReader();

    reader.onload = () => {

      this.imagePreview =
        reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  /**
   * Čuvanje vesti.
   */
  saveNews(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.title.trim()) {

      this.errorMessage =
        'Naslov je obavezan.';

      return;
    }

    if (!this.content.trim()) {

      this.errorMessage =
        'Tekst vesti je obavezan.';

      return;
    }

    this.saving = true;

    /*
     * DODAVANJE
     */
    if (!this.isEditMode) {

      this.newsService
        .create(
          this.title.trim(),
          this.content.trim(),
          this.selectedImage
        )
        .subscribe({

          next: () => {

            this.saving = false;
            this.currentPage = 1;

            this.successMessage =
              'Vest je uspešno dodata.';

            this.closeForm();

            this.loadNews();
          },

          error: (error) => {

            console.error(
              'Greška prilikom dodavanja:',
              error
            );

            this.errorMessage =
              error?.error?.message ??
              'Greška prilikom dodavanja vesti.';

            this.saving = false;
          }
        });

      return;
    }

    /*
     * IZMENA
     */
    if (this.selectedNewsId === null) {

      this.errorMessage =
        'Nije izabrana vest za izmenu.';

      this.saving = false;

      return;
    }

    this.newsService
      .update(
        this.selectedNewsId,
        this.title.trim(),
        this.content.trim(),
        this.selectedImage
      )
      .subscribe({

        next: () => {

          this.saving = false;

          this.successMessage =
            'Vest je uspešno izmenjena.';

          this.closeForm();

          this.loadNews();
        },

        error: (error) => {

          console.error(
            'Greška prilikom izmene:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'Greška prilikom izmene vesti.';

          this.saving = false;
        }
      });
  }

  /**
   * Brisanje vesti.
   */
  /**
   * Otvara modal za potvrdu brisanja vesti.
   */
  deleteNews(item: News): void {

    this.newsToDelete = item;
    this.deleteModalVisible = true;

    this.errorMessage = '';
    this.successMessage = '';
  }


  /**
   * Zatvara modal za brisanje.
   */
  closeDeleteModal(): void {

    if (this.deleting) {
      return;
    }

    this.deleteModalVisible = false;
    this.newsToDelete = null;
  }


  /**
   * Potvrđuje brisanje vesti.
   */
  confirmDelete(): void {

    if (!this.newsToDelete || this.deleting) {
      return;
    }

    const newsId = this.newsToDelete.id;

    this.deleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.newsService
      .delete(newsId)
      .subscribe({

        next: () => {

          this.deleting = false;

          this.deleteModalVisible = false;
          this.newsToDelete = null;

          this.successMessage =
            'Vest je uspešno obrisana.';

          /*
          * Ako je obrisana poslednja vest
          * na trenutnoj stranici, vratićemo se
          * automatski na prethodnu stranicu.
          */
          const newTotalPages =
            Math.ceil(
              (this.news.length - 1) /
              this.pageSize
            );

          if (
            this.currentPage > Math.max(1, newTotalPages)
          ) {
            this.currentPage =
              Math.max(1, newTotalPages);
          }

          this.loadNews();
        },

        error: (error) => {

          console.error(
            'Greška prilikom brisanja:',
            error
          );

          this.deleting = false;

          this.errorMessage =
            error?.error?.message ??
            'Greška prilikom brisanja vesti.';
        }
      });
  }

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
   * Kratak tekst za karticu.
   */
  getShortContent(
    content: string
  ): string {

    const maxLength = 140;

    if (content.length <= maxLength) {
      return content;
    }

    return (
      content.substring(0, maxLength).trim() +
      '...'
    );
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
        month: '2-digit',
        year: 'numeric'
      }
    ).format(
      new Date(date)
    );
  }
}