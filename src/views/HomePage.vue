<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Barcode Scanner</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Barcode Liste -->
      <ion-list v-if="barcodes.length > 0">
        <ion-item
          v-for="(barcode, index) in barcodes"
          :key="index"
          button
          @click="handleBarcodeClick(barcode)"
        >
          <ion-label>
            <h2>{{ barcode.displayValue }}</h2>
            <p>Format: {{ barcode.format }}</p>
            <p>Typ: {{ barcode.valueType }}</p>
          </ion-label>

          <!-- Aktionen -->
          <ion-buttons slot="end">
            <ion-button fill="clear" @click.stop="copyToClipboard(barcode.displayValue)">
              📋
            </ion-button>
            <ion-button fill="clear" @click.stop="shareBarcode(barcode.displayValue)">
              🔗
            </ion-button>
            <ion-button fill="clear" color="danger" @click.stop="deleteBarcode(index)">
              🗑️
            </ion-button>
          </ion-buttons>
        </ion-item>
      </ion-list>

      <ion-text v-else class="ion-padding">
        Noch keine Barcodes gescannt.
      </ion-text>

      <!-- Buttons -->
      <ion-footer class="ion-padding ion-text-center">
        <ion-button expand="block" @click="scanBarcode">
          📷 Barcode scannen
        </ion-button>
        <ion-button expand="block" color="medium" @click="pickFromGallery" class="ion-margin-top">
          🖼️ Bild aus Galerie wählen
        </ion-button>
      </ion-footer>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonFooter,
  IonText,
  IonButtons,
} from '@ionic/vue';

import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { Preferences } from '@capacitor/preferences';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { ref, onMounted } from 'vue';
import { FilePicker } from '@capawesome/capacitor-file-picker';

// Barcode-Daten
const barcodes = ref<
  {
    displayValue: string;
    format: string;
    valueType: string;
  }[]
>([]);

// Barcodes aus Speicher laden
onMounted(async () => {
  const result = await Preferences.get({ key: 'barcodes' });
  if (result.value) {
    barcodes.value = JSON.parse(result.value);
  }
});

// Speichern der Barcodes in Preferences
async function saveBarcodes() {
  await Preferences.set({
    key: 'barcodes',
    value: JSON.stringify(barcodes.value),
  });
}

// Barcode scannen
async function scanBarcode() {
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

// Galerie öffnen (noch leer)
async function pickFromGallery() {
  try {
    const { files } = await FilePicker.pickImages();

    if (!files || files.length === 0) {
      console.log('Kein Bild ausgewählt');
      return;
    }

    const selectedImage = files[0];

    if (!selectedImage.path) {
      console.error('Bildpfad ist nicht verfügbar');
      return;
    }

    const { barcodes: detectedBarcodes } = await BarcodeScanner.readBarcodesFromImage({
      path: selectedImage.path,
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
async function shareBarcode(text: string) {
  try {
    await Share.share({
      title: 'Barcode teilen',
      text: text,
    });
  } catch (err) {
    console.error('Teilen fehlgeschlagen:', err);
  }
}

// Barcode in Zwischenablage kopieren
async function copyToClipboard(text: string) {
  await Clipboard.write({ string: text });
  console.log('In Zwischenablage kopiert:', text);
}

// Barcode löschen
async function deleteBarcode(index: number) {
  barcodes.value.splice(index, 1);
  await saveBarcodes();
}

// URL oder Telefon öffnen
function handleBarcodeClick(barcode: { displayValue: string; valueType: string }) {
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
</script>

<style scoped>
ion-footer {
  margin-top: auto;
}
html,
body,
#app {
  height: 100%;
  background: transparent;
}
</style>
