import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface News {
  id: number;
  title: string;
  imageUrl: string | null;
  content: string;
  createdAt: string;
  updatedAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminNewsService {

  private readonly apiUrl = `${environment.apiUrl}/News`;

  constructor(
    private http: HttpClient
  ) {}

  /**
   * Dohvata sve vesti.
   */
  getAll(): Observable<News[]> {
    return this.http.get<News[]>(this.apiUrl);
  }

  /**
   * Dohvata jednu vest po ID-u.
   */
  getById(id: number): Observable<News> {
    return this.http.get<News>(
      `${this.apiUrl}/${id}`
    );
  }

  /**
   * Dodavanje nove vesti.
   *
   * Backend očekuje multipart/form-data:
   * - title
   * - content
   * - image
   */
  create(
    title: string,
    content: string,
    image: File | null
  ): Observable<News> {

    const formData = new FormData();

    formData.append('title', title);
    formData.append('content', content);

    if (image) {
      formData.append(
        'image',
        image,
        image.name
      );
    }

    return this.http.post<News>(
      this.apiUrl,
      formData
    );
  }

  /**
   * Izmena postojeće vesti.
   */
  update(
    id: number,
    title: string,
    content: string,
    image: File | null
  ): Observable<News> {

    const formData = new FormData();

    formData.append('title', title);
    formData.append('content', content);

    if (image) {
      formData.append(
        'image',
        image,
        image.name
      );
    }

    return this.http.put<News>(
      `${this.apiUrl}/${id}`,
      formData
    );
  }

  /**
   * Brisanje vesti.
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}