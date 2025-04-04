import { Injectable, signal } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
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
  private readonly dbName = 'FontsDB';
  private readonly storeName = 'fonts';
  readonly $fonts = signal<SelectedFont[]>([]);

  private initDB(): Observable<IDBDatabase> {
    return new Observable((observer) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'fontName' });
        }
      };

      request.onsuccess = () => {
        observer.next(request.result);
        observer.complete();
      };
      request.onerror = () => observer.error(request.error);
    });
  }

  loadFonts(): Observable<void> {
    return this.initDB().pipe(
      switchMap(
        (db) =>
          new Observable<void>((observer) => {
            const transaction = db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = async () => {
              const fonts = request.result as SelectedFont[];
              for (const { fontName, fontBase64 } of fonts) {
                const newFont = await new FontFace(
                  fontName,
                  `url(${fontBase64})`,
                ).load();
                document.fonts.add(newFont);
              }
              this.$fonts.set(fonts);
              observer.next();
              observer.complete();
            };
            request.onerror = () => observer.error(request.error);
          }),
      ),
    );
  }

  addFont(file: File): Observable<void> {
    if (!this.allowedTypes.includes(file.type)) return from(Promise.resolve());

    return this.convertToBase64(file).pipe(
      switchMap((fontBase64) => {
        if (!fontBase64) return from(Promise.resolve());

        const fontName = file.name.replace(/\.[^/.]+$/, '');
        return from(new FontFace(fontName, `url(${fontBase64})`).load()).pipe(
          switchMap((fontFace) => {
            document.fonts.add(fontFace);

            const cachedFonts = this.$fonts();
            if (cachedFonts.some((font) => font.fontName === fontName)) {
              return from(Promise.resolve());
            }

            const newFontData: SelectedFont = { fontName, fontBase64 };
            const updatedFonts = [...cachedFonts, newFontData];
            this.$fonts.set(updatedFonts);

            return this.initDB().pipe(
              map((db) => {
                const transaction = db.transaction(this.storeName, 'readwrite');
                const store = transaction.objectStore(this.storeName);
                store.put(newFontData);
              }),
            );
          }),
        );
      }),
    );
  }

  removeFont(fontName: string): Observable<void> {
    const updatedFonts = this.$fonts().filter(
      (font) => font.fontName !== fontName,
    );
    this.$fonts.set(updatedFonts);

    return this.initDB().pipe(
      map((db) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        store.delete(fontName);
      }),
    );
  }

  private convertToBase64(file: File): Observable<string | null> {
    return new Observable((observer) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        observer.next(reader.result as string);
        observer.complete();
      };
      reader.onerror = () => {
        observer.next(null);
        observer.complete();
      };
    });
  }
}
