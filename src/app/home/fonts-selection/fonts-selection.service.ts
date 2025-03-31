import { Injectable } from '@angular/core';
import { SelectedFont } from './fonts-selection.model';

@Injectable({
  providedIn: 'root',
})
export class FontsSelectionService {
  async convertToBase64(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
    });
  }

  loadCachedFonts(): SelectedFont[] {
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
        console.log('Loaded font:', fontName);
      },
    );

    return cachedFonts;
  }
}
