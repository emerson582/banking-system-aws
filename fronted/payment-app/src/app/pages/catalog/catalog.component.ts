import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogService } from '../../services/catalog.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './catalog.component.html'
})
export class CatalogComponent implements OnInit {

  catalog: any[] = [];

  constructor(
  private catalogService: CatalogService,
  private cd: ChangeDetectorRef
) {}

  ngOnInit(): void {
  this.catalogService.getCatalog().subscribe({
    next: (data) => {
      console.log("DATA RAW ", data);
      console.log("TYPE ", typeof data);

      if (typeof data === 'string') {
        this.catalog = JSON.parse(data);
      } else {
        this.catalog = data;
      }

      console.log("CATALOG ", this.catalog);

      this.cd.detectChanges(); // 👈 🔥 ESTA LÍNEA SOLUCIONA TODO
    },
    error: (err) => console.error("ERROR ", err)
  });
}
}