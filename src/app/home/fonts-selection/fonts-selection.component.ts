import {
  Component,
  effect,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { tap } from 'rxjs';
import { SelectedFont } from './fonts-selection.model';
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
      @for (font of $fonts(); track font.fontName) {
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
export class FontsSelectionComponent implements OnInit {
  private readonly fontsSelectionService = inject(FontsSelectionService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly $fontsSelected = output<string[]>({
    alias: 'fontsSelected',
  });

  protected readonly $fonts = signal<SelectedFont[]>([]);
  protected readonly fontForm = this.formBuilder.group({});

  constructor() {
    effect(() => {
      const fonts = this.$fonts();

      fonts.forEach((font) => {
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

  ngOnInit(): void {
    const fonts = this.fontsSelectionService.getFonts();
    this.$fonts.set(fonts);
  }

  protected onRemoveFont(fontName: string) {
    this.fontForm.removeControl(fontName);
    this.fontsSelectionService.removeFont(fontName);
    this.$fonts.set([...this.fontsSelectionService.getFonts()]);
  }

  protected async onSubmit(selectedFiles: FileList | null) {
    if (!selectedFiles) return;

    await Promise.all(
      Array.from(selectedFiles).map((file) =>
        this.fontsSelectionService.addFont(file),
      ),
    );

    const fonts = this.fontsSelectionService.getFonts();
    this.$fonts.set([...fonts]);
  }
}
