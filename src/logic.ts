import { ref, onMounted } from 'vue';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { Preferences } from '@capacitor/preferences';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { FilePicker } from '@capawesome/capacitor-file-picker';

// Reaktive Liste von Barcodes
export const barcodes = ref<
  {
    displayValue: string;
    format: string;
    valueType: string;
  }[]
>([]);

// Beim Mounten: Barcodes aus Preferences laden
onMounted(async () => {
  const result = await Preferences.get({ key: 'barcodes' });
  if (result.value) {
    barcodes.value = JSON.parse(result.value);
  }
});

// Barcodes persistent speichern
export async function saveBarcodes() {
  await Preferences.set({
    key: 'barcodes',
    value: JSON.stringify(barcodes.value),
  });
}

// Scannen über Kamera
export async function scanBarcode() {
  try {
    const { camera } = await BarcodeScanner.requestPermissions();
    if (!camera) {
      console.warn('Kamera-Berechtigung nicht erteilt');
      return;
    }

    const { barcodes: scannedBarcodes } = await BarcodeScanner.scan({
      formats: [], // alle Formate
    });

    if (scannedBarcodes.length > 0) {
      const scanned = scannedBarcodes[0];
      const newBarcode = {
        displayValue: scanned.displayValue ?? scanned.rawValue ?? 'Unbekannt',
        format: scanned.format ?? 'UNKNOWN',
        valueType: scanned.valueType ?? 'TEXT',
      };
      barcodes.value.unshift(newBarcode);
      await saveBarcodes();
    } else {
      console.log('Kein Barcode erkannt');
    }
  } catch (error) {
    console.error('Scan fehlgeschlagen:', error);
  }
}

// Bild aus Galerie wählen und Barcode lesen
export async function pickFromGallery() {
  try {
    const { files } = await FilePicker.pickImages();
    if (!files || files.length === 0 || !files[0].path) {
      console.log('Kein Bild ausgewählt oder Pfad ungültig');
      return;
    }

    const { barcodes: detectedBarcodes } = await BarcodeScanner.readBarcodesFromImage({
      path: files[0].path,
      formats: [
        BarcodeFormat.QrCode,
        BarcodeFormat.Code128,
        BarcodeFormat.Ean13,
        BarcodeFormat.Ean8,
        BarcodeFormat.UpcA,
        BarcodeFormat.UpcE,
      ],
    });

    if (detectedBarcodes.length === 0) {
      console.log('Kein Barcode erkannt');
      return;
    }

    for (const scanned of detectedBarcodes) {
      const newBarcode = {
        displayValue: scanned.displayValue ?? scanned.rawValue ?? 'Unbekannt',
        format: scanned.format ?? 'UNKNOWN',
        valueType: scanned.valueType ?? 'TEXT',
      };
      barcodes.value.unshift(newBarcode);
    }

    await saveBarcodes();
  } catch (error) {
    console.error('Fehler beim Lesen des Bildes:', error);
  }
}

// Barcode teilen
export async function shareBarcode(text: string) {
  try {
    await Share.share({
      title: 'Barcode teilen',
      text,
    });
  } catch (err) {
    console.error('Teilen fehlgeschlagen:', err);
  }
}

// In Zwischenablage kopieren
export async function copyToClipboard(text: string) {
  await Clipboard.write({ string: text });
  console.log('In Zwischenablage kopiert:', text);
}

// Löschen eines Barcodes
export async function deleteBarcode(index: number) {
  barcodes.value.splice(index, 1);
  await saveBarcodes();
}

// Barcode-Verhalten bei Klick
export function handleBarcodeClick(barcode: { displayValue: string; valueType: string }) {
  const value = barcode.displayValue;

  if (barcode.valueType === 'URL') {
    if (!value.startsWith('http')) {
      console.warn('Ungültige URL:', value);
      return;
    }
    Browser.open({ url: value });
  } else if (barcode.valueType === 'PHONE') {
    window.open(`tel:${value}`, '_system');
  } else {
    console.log('Nicht klickbarer Typ:', barcode.valueType);
  }
}
