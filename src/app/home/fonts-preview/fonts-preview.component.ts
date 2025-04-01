import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEFAULT_EDITOR_CONTENT } from '../home.consts';

@Component({
  template: `
    <div class="flex flex-col gap-1 items-end">
      <div>
        <button class="btn btn-sm btn-outline" (click)="onResetContent()">
          Reset
        </button>
      </div>
      <textarea
        class="textarea w-full"
        [rows]="45"
        [(ngModel)]="$content"
      ></textarea>
    </div>
  `,
  imports: [FormsModule],
  selector: 'app-fonts-preview',
})
export class FontsPreviewComponent {
  protected readonly $content = model(DEFAULT_EDITOR_CONTENT);

  protected onResetContent() {
    this.$content.set(DEFAULT_EDITOR_CONTENT);
  }
}
