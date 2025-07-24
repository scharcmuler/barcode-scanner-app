import { ref, onMounted } from 'vue';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { Preferences } from '@capacitor/preferences';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { FilePicker } from '@capawesome/capacitor-file-picker';

export const barcodes = ref<
  {
    displayValue: string;
    format: string;
    valueType: string;
    scannedAt?: string;
  }[]
>([]);

export const editMode = ref(false);
export const selectedIndexes = ref<number[]>([]);
export const expandedIndexes = ref<number[]>([]);
export const showSortOptions = ref(false);

onMounted(async () => {
  const result = await Preferences.get({ key: 'barcodes' });
  if (result.value) {
    barcodes.value = JSON.parse(result.value);
  }
});

export async function saveBarcodes() {
  await Preferences.set({
    key: 'barcodes',
    value: JSON.stringify(barcodes.value),
  });
}

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
        scannedAt: new Date().toISOString(),
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

export async function pickFromGallery() {
  try {
    const { files } = await FilePicker.pickImages();
    if (!files || files.length === 0 || !files[0].path) {
      console.log('Kein Bild ausgewählt oder Pfad ungültig');
      return;
    }

    const { barcodes: detectedBarcodes } = await BarcodeScanner.readBarcodesFromImage({
      path: files[0].path,
      formats: [],
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
        scannedAt: new Date().toISOString(),
      };
      barcodes.value.unshift(newBarcode);
    }

    await saveBarcodes();
  } catch (error) {
    console.error('Fehler beim Lesen des Bildes:', error);
  }
}

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

export async function copyToClipboard(text: string) {
  await Clipboard.write({ string: text });
  console.log('In Zwischenablage kopiert:', text);
}

export async function deleteBarcode(index: number) {
  barcodes.value.splice(index, 1);
  await saveBarcodes();
}

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

export function toggleEditMode() {
  editMode.value = !editMode.value;
  selectedIndexes.value = [];
}

export function toggleSelection(index: number) {
  const pos = selectedIndexes.value.indexOf(index);
  if (pos > -1) {
    selectedIndexes.value.splice(pos, 1);
  } else {
    selectedIndexes.value.push(index);
  }
}

export function selectAll() {
  if (selectedIndexes.value.length === barcodes.value.length) {
    selectedIndexes.value = [];
  } else {
    selectedIndexes.value = barcodes.value.map((_, index) => index);
  }
}

export async function deleteSelected() {
  if (selectedIndexes.value.length >= 2) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIndexes.value.length} items?`
    );
    if (!confirmed) return;
  }

  selectedIndexes.value.sort((a, b) => b - a);
  for (const index of selectedIndexes.value) {
    await deleteBarcode(index);
  }

  selectedIndexes.value = [];
  editMode.value = false;
}

export function toggleDetails(index: number) {
  const pos = expandedIndexes.value.indexOf(index);
  if (pos > -1) {
    expandedIndexes.value.splice(pos, 1);
  } else {
    expandedIndexes.value.push(index);
  }
}


export function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString();
}

export function sortBarcodes(type: 'date' | 'value') {
  if (type === 'date') {
    barcodes.value.sort((a, b) => {
      const timeA = new Date(a.scannedAt ?? 0).getTime();
      const timeB = new Date(b.scannedAt ?? 0).getTime();
      return timeB - timeA;
    });
  } else if (type === 'value') {
    barcodes.value.sort((a, b) =>
      (a.displayValue ?? '').localeCompare(b.displayValue ?? '')
    );
  }
}
