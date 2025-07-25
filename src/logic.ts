import { ref, computed, watch, nextTick } from 'vue';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Preferences } from '@capacitor/preferences';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { FilePicker } from '@capawesome/capacitor-file-picker';

interface BarcodeEntry {
  id: string;
  displayValue: string;
  format: string;
  valueType: string;
  scannedAt?: string;
}

export const barcodes = ref<BarcodeEntry[]>([]);
export const editMode = ref(false);
export const selectedIds = ref<string[]>([]);
export const expandedIds = ref<string[]>([]);
export const showFilterAlert = ref(false);
export const showDeleteConfirmAlert = ref(false);

/* ---------------- persistence ---------------- */
const STORAGE_KEY = 'barcodes';
export async function loadBarcodes() {
  const { value } = await Preferences.get({ key: STORAGE_KEY });
  if (value) barcodes.value = JSON.parse(value);
}
async function saveBarcodes() {
  await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(barcodes.value) });
}

/* ---------------- barcode creation helpers ---------------- */
function createEntry(scanned: any): BarcodeEntry {
  return {
    id: crypto.randomUUID(),
    displayValue: scanned.displayValue ?? scanned.rawValue ?? 'Unknown',
    format: scanned.format ?? 'UNKNOWN',
    valueType: scanned.valueType ?? 'TEXT',
    scannedAt: new Date().toISOString(),
  };
}

/* ---------------- scanning ---------------- */
export async function scanBarcode() {
  try {
    const { camera } = await BarcodeScanner.requestPermissions();
    if (!camera) return;
    const { barcodes: result } = await BarcodeScanner.scan({ formats: [] });
    if (result.length) {
      barcodes.value.unshift(createEntry(result[0]));
      await saveBarcodes();
    }
  } catch (e) { console.error(e); }
}

export async function pickFromGallery() {
  try {
    const { files } = await FilePicker.pickImages();
    if (!files?.[0]?.path) return;
    const { barcodes: detected } = await BarcodeScanner.readBarcodesFromImage({ path: files[0].path, formats: [] });
    detected.forEach(b => barcodes.value.unshift(createEntry(b)));
    await saveBarcodes();
  } catch (e) { console.error(e); }
}

/* ---------------- util actions ---------------- */
export const copyToClipboard = (text: string) => Clipboard.write({ string: text });
export const shareBarcode   = (text: string) => Share.share({ title: 'Barcode', text });

export function deleteBarcode(id: string) {
  const idx = barcodes.value.findIndex(b => b.id === id);
  if (idx !== -1) barcodes.value.splice(idx, 1);
  saveBarcodes();
}

export function handleBarcodeClick(entry: BarcodeEntry) {
  if (entry.valueType === 'URL' && entry.displayValue.startsWith('http')) Browser.open({ url: entry.displayValue });
  else if (entry.valueType === 'PHONE') window.open(`tel:${entry.displayValue}`, '_system');
}

/* ---------------- edit‑mode helpers ---------------- */
export const toggleEditMode = () => { editMode.value = !editMode.value; selectedIds.value = []; };
export function toggleSelection(id: string) {
  const i = selectedIds.value.indexOf(id);
  i > -1 ? selectedIds.value.splice(i, 1) : selectedIds.value.push(id);
}

export const allSelected = computed(
  () => barcodes.value.length > 0 && selectedIds.value.length === barcodes.value.length
);

export function toggleSelectAll() {
  allSelected.value
    ? (selectedIds.value = [])
    : (selectedIds.value = barcodes.value.map(b => b.id));
}

export const requestDeleteSelected = () => (showDeleteConfirmAlert.value = true);
export async function confirmDeleteSelected() {
  for (const id of [...selectedIds.value]) deleteBarcode(id);
  selectedIds.value = []; editMode.value = false; showDeleteConfirmAlert.value = false;
}
export function toggleDetails(id: string) {
  const i = expandedIds.value.indexOf(id);
  i > -1 ? expandedIds.value.splice(i, 1) : expandedIds.value.push(id);
}

export const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '');

/* ---------------- filtering ---------------- */
export const activeValueTypes = computed(() => Array.from(new Set(barcodes.value.map(b => b.valueType))));
export const selectedValueTypes = ref<string[]>([]);
watch(activeValueTypes, types => {
  if (!selectedValueTypes.value.length) selectedValueTypes.value = [...types];
  else types.forEach(t => { if (!selectedValueTypes.value.includes(t)) selectedValueTypes.value.push(t); });
});
export const filteredBarcodes = computed(() =>
  selectedValueTypes.value.length
    ? barcodes.value.filter(b => selectedValueTypes.value.includes(b.valueType))
    : []
);