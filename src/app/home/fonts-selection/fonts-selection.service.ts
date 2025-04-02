import { Injectable, signal } from '@angular/core';
import { SelectedFont } from './fonts-selection.model';

@Injectable({
  providedIn: 'root',
})
export class FontsSelectionService {
  private readonly allowedTypes = [
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2',
    'application/x-font-ttf',
    'application/x-font-otf',
    'application/font-woff',
    'application/font-woff2',
  ];
  private readonly $fonts = signal<SelectedFont[]>([]);

  getFonts(): SelectedFont[] {
    const fonts = this.$fonts();
    if (fonts.length > 0) return fonts;

    const cachedFonts = JSON.parse(localStorage.getItem('cachedFonts') || '[]');
    cachedFonts.forEach(
      async ({
        fontName,
        fontBase64,
      }: {
        fontName: string;
        fontBase64: string;
      }) => {
        const newFont = await new FontFace(
          fontName,
          `url(${fontBase64})`,
        ).load();
        document.fonts.add(newFont);
      },
    );

    this.$fonts.set(cachedFonts);
    return cachedFonts;
  }

  async addFont(file: File): Promise<void> {
    if (!this.allowedTypes.includes(file.type)) return;

    const fontBase64 = await this.convertToBase64(file);
    if (!fontBase64) return;

    const fontName = file.name.replace(/\.[^/.]+$/, '');

    const newFont = await new FontFace(fontName, `url(${fontBase64})`).load();
    document.fonts.add(newFont);

    const cachedFonts = this.getFonts();

    if (cachedFonts.some((font: SelectedFont) => font.fontName === fontName))
      return;

    cachedFonts.push({ fontName, fontBase64 });
    localStorage.setItem('cachedFonts', JSON.stringify(cachedFonts));
    this.$fonts.set(cachedFonts);
  }

  removeFont(fontName: string) {
    const fonts = this.$fonts();
    const index = fonts.findIndex((font) => font.fontName === fontName);
    if (index === -1) return;
    fonts.splice(index, 1);
    this.$fonts.set(fonts);
    localStorage.setItem('cachedFonts', JSON.stringify(fonts));
  }

  async convertToBase64(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
    });
  }
}
