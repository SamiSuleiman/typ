import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEFAULT_EDITOR_CONTENT } from './home.consts';
import { FontsSelectionComponent } from './fonts-selection/fonts-selection.component';

@Component({
  template: `
    <main class="p-2 flex flex-col items-start justify-center gap-1">
      <div>
        <app-fonts-selection></app-fonts-selection>
      </div>
      <div class="w-full">
        <textarea
          class="textarea w-full"
          [rows]="40"
          [(ngModel)]="$content"
        ></textarea>
      </div>
    </main>
  `,
  imports: [FormsModule, FontsSelectionComponent],
  selector: 'app-home',
})
export class HomeComponent {
  protected readonly $content = model(DEFAULT_EDITOR_CONTENT);
}
