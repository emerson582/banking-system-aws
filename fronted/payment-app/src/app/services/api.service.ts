import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  baseUrl = "https://67iukiltfg.execute-api.us-east-1.amazonaws.com/dev";

  constructor(private http: HttpClient) {}

  getCatalog() {
    return this.http.get(`${this.baseUrl}/catalog`);
  }

  startPayment(data: any) {
    return this.http.post(`${this.baseUrl}/payment`, data);
  }
}