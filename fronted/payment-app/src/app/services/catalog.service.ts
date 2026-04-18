import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {

private apiUrl = 'https://67iukiltfg.execute-api.us-east-1.amazonaws.com/dev/catalog';

  constructor(private http: HttpClient) {}

  getCatalog(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}