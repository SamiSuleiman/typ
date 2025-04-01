import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectedFont } from './fonts-selection.model';
import { FontsSelectionService } from './fonts-selection.service';

@Component({
  template: `
    <div class="flex gap-1">
      <input type="file" class="file-input" [multiple]="true" #fileInput />
      <button class="btn" (click)="onSubmit(fileInput.files)">Submit</button>
    </div>
    <ul
      class="list bg-base-100 rounded-box shadow-md max-h-[90vh] overflow-y-auto"
    >
      @for (font of $fonts(); track $index) {
        <li class="list-row justify-items-end items-center">
          <div>{{ font.fontName }}</div>
          <button
            class="btn btn-square btn-ghost"
            (click)="onRemoveFont(font.fontName)"
          >
            X
          </button>
        </li>
      }
    </ul>
  `,
  imports: [FormsModule],
  selector: 'app-fonts-selection',
})
export class FontsSelectionComponent implements OnInit {
  private readonly fontsSelectionService = inject(FontsSelectionService);

  protected readonly $fonts = signal<SelectedFont[]>([]);

  ngOnInit(): void {
    const fonts = this.fontsSelectionService.getFonts();
    this.$fonts.set(fonts);
    fonts.forEach((font) => {
      console.log('Setting font family:', font.fontName);
      document.body.style.fontFamily = font.fontName + ', sans-serif';
    });
  }

  protected onRemoveFont(fontName: string) {
    this.fontsSelectionService.removeFont(fontName);
    this.$fonts.set(this.fontsSelectionService.getFonts());
  }

  protected async onSubmit(selectedFiles: FileList | null) {
    if (!selectedFiles) return;

    await Promise.all(
      Array.from(selectedFiles).map((file) =>
        this.fontsSelectionService.addFont(file),
      ),
    );
  }
}
