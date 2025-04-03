import { Component, effect, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { take, tap, zip } from 'rxjs';
import { FontsSelectionService } from './fonts-selection.service';

@Component({
  template: `
    <div class="flex gap-1 flex-col">
      <input type="file" class="file-input" [multiple]="true" #fileInput />
      <button class="btn btn-neutral" (click)="onSubmit(fileInput.files)">
        Submit
      </button>
    </div>
    <ul
      class="list bg-base-100 rounded-box shadow-md max-h-[90vh] overflow-y-auto"
    >
      @for (font of fontsSelectionService.$fonts(); track font.fontName) {
        <li class="list-row items-center" [formGroup]="fontForm">
          <input
            [formControlName]="font.fontName"
            type="checkbox"
            checked="checked"
            class="checkbox"
          />
          <p>{{ font.fontName }}</p>
          <button
            class="btn btn-square btn-ghost"
            (click)="onRemoveFont(font.fontName)"
          >
            x
          </button>
        </li>
      }
    </ul>
  `,
  imports: [FormsModule, ReactiveFormsModule],
  selector: 'app-fonts-selection',
})
export class FontsSelectionComponent {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly fontsSelectionService = inject(FontsSelectionService);

  protected readonly $fontsSelected = output<string[]>({
    alias: 'fontsSelected',
  });
  protected readonly fontForm = this.formBuilder.group({});

  constructor() {
    this.fontsSelectionService
      .loadFonts()
      .pipe(takeUntilDestroyed())
      .subscribe();

    effect(() => {
      this.fontsSelectionService.$fonts()?.forEach((font) => {
        const currControls = Object.keys(this.fontForm.controls);
        if (currControls.includes(font.fontName)) return;
        this.fontForm.addControl(font.fontName, this.formBuilder.control(true));
      });
    });

    this.fontForm.valueChanges
      .pipe(
        tap((value: Record<string, boolean>) => {
          const keyvals = Object.entries(value);
          const trueFonts = keyvals.filter(([_, isSelected]) => isSelected);
          const fontNames = trueFonts.map(([fontName]) => fontName);
          this.$fontsSelected.emit(fontNames);
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected onRemoveFont(fontName: string): void {
    const fonts = this.fontsSelectionService.$fonts();
    if (!fonts) return;
    this.fontForm.removeControl(fontName);
    this.fontsSelectionService.removeFont(fontName).pipe(take(1)).subscribe();
  }

  protected onSubmit(selectedFiles: FileList | null): void {
    if (!selectedFiles) return;

    zip(
      Array.from(selectedFiles).map((file) =>
        this.fontsSelectionService.addFont(file),
      ),
    )
      .pipe(take(1))
      .subscribe();
  }
}
