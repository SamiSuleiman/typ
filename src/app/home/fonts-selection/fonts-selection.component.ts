import {
  Component,
  effect,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectedFont } from './fonts-selection.model';
import { FontsSelectionService } from './fonts-selection.service';

@Component({
  template: `
    <div class="flex gap-1 flex-col">
      <input type="file" class="file-input" [multiple]="true" #fileInput />
      <button class="btn" (click)="onSubmit(fileInput.files)">Submit</button>
    </div>
    <ul
      class="list bg-base-100 rounded-box shadow-md max-h-[90vh] overflow-y-auto"
    >
      @for (font of $fonts(); track font.fontName) {
        <li
          class="list-row justify-items-end items-center"
          formArrayName="fontForm"
        >
          <input
            type="checkbox"
            checked="checked"
            class="checkbox"
            (change)="onFontSelection(font.fontName)"
          />
          <p>{{ font.fontName }}</p>
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

  protected readonly $fontsSelected = output<string[]>({
    alias: 'fontsSelected',
  });

  private readonly $selectedFonts = signal<string[]>([]);
  protected readonly $fonts = signal<SelectedFont[]>([]);

  constructor() {
    effect(() => {
      this.$fontsSelected.emit(this.$selectedFonts());
    });
  }

  ngOnInit(): void {
    const fonts = this.fontsSelectionService.getFonts();
    this.$fonts.set(fonts);
    this.$selectedFonts.set(fonts.map((font) => font.fontName));
  }

  protected onFontSelection(fontName: string) {
    const isFontSelected = this.$selectedFonts().includes(fontName);
    if (isFontSelected)
      this.$selectedFonts.set(
        this.$selectedFonts().filter((font) => font !== fontName),
      );
    else this.$selectedFonts.set([...this.$selectedFonts(), fontName]);
  }

  protected onRemoveFont(fontName: string) {
    this.fontsSelectionService.removeFont(fontName);
    this.$fonts.set(this.fontsSelectionService.getFonts());
    this.$selectedFonts.set(
      this.$selectedFonts().filter((font) => font !== fontName),
    );
  }

  protected async onSubmit(selectedFiles: FileList | null) {
    if (!selectedFiles) return;

    await Promise.all(
      Array.from(selectedFiles).map((file) =>
        this.fontsSelectionService.addFont(file),
      ),
    );

    const fonts = this.fontsSelectionService.getFonts();
    this.$fonts.set(fonts);
    this.$selectedFonts.set(fonts.map((f) => f.fontName));
  }
}
