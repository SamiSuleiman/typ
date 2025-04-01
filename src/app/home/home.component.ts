import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontsSelectionComponent } from './fonts-selection/fonts-selection.component';
import { FontsPreviewComponent } from './fonts-preview/fonts-preview.component';

@Component({
  template: `
    <main class="p-2 flex items-start justify-center gap-1">
      <div>
        <app-fonts-selection></app-fonts-selection>
      </div>
      <div class="w-full">
        <app-fonts-preview></app-fonts-preview>
      </div>
    </main>
  `,
  imports: [FormsModule, FontsSelectionComponent, FontsPreviewComponent],
  selector: 'app-home',
})
export class HomeComponent {}
