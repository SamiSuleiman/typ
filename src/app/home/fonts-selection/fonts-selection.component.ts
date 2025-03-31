import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectedFont } from './fonts-selection.model';
import { FontsSelectionService } from './fonts-selection.service';

@Component({
  template: `
    <div class="flex gap-1">
      <input type="file" class="file-input" [multiple]="true" #fileInput />
      <button class="btn" (click)="onSubmit(fileInput.files)">Submit</button>
    </div>
  `,
  imports: [FormsModule],
  selector: 'app-fonts-selection',
})
export class FontsSelectionComponent implements OnInit {
  private readonly fontsSelectionService = inject(FontsSelectionService);

  ngOnInit(): void {
    const fonts = this.fontsSelectionService.loadCachedFonts();
    fonts.forEach((font) => {
      console.log('Setting font family:', font.fontName);
      document.body.style.fontFamily = font.fontName + ', sans-serif';
    });
  }

  protected async onSubmit(selectedFiles: FileList | null) {
    if (!selectedFiles) return;

    const allowedTypes = [
      'font/ttf',
      'font/otf',
      'font/woff',
      'font/woff2',
      'application/x-font-ttf',
      'application/x-font-otf',
      'application/font-woff',
      'application/font-woff2',
    ];

    const fonts = (
      await Promise.all(
        Array.from(selectedFiles).map(async (file) => {
          if (!allowedTypes.includes(file.type)) {
            alert(
              'Invalid font type. Please upload a TTF, OTF, WOFF, or WOFF2 file.',
            );
            return;
          }

          const fontBase64 =
            await this.fontsSelectionService.convertToBase64(file);
          if (!fontBase64) return;

          const fontName = file.name.replace(/\.[^/.]+$/, '');

          const newFont = await new FontFace(
            fontName,
            `url(${fontBase64})`,
          ).load();
          document.fonts.add(newFont);

          const cachedFonts = JSON.parse(
            localStorage.getItem('cachedFonts') || '[]',
          );

          if (
            cachedFonts.some((font: SelectedFont) => font.fontName === fontName)
          ) {
            alert('Font already added.');
            return;
          }

          cachedFonts.push({ fontName, fontBase64 });
          localStorage.setItem('cachedFonts', JSON.stringify(cachedFonts));
          return { fontName, fontBase64 } as SelectedFont;
        }),
      )
    ).filter((font) => !!font) as SelectedFont[];
  }
}
