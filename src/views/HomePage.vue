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
      <div class="footer">
        <button class="scanner-button" @click="scanBarcode">
          <img src="../assets/scanner.png" alt="Scanner">
          <p>Scanner</p>
        </button>
        <button class="list-button">
          <img src="../assets/list.png" alt="List">
          <p>List</p>
        </button>
        <button class="gallery-button" @click="pickFromGallery">
          <img src="../assets/gallery.png" alt="Gallery">
          <p>Gallery</p>
        </button>
      </div>
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

import {
  barcodes,
  scanBarcode,
  pickFromGallery,
  copyToClipboard,
  shareBarcode,
  deleteBarcode,
  handleBarcodeClick,
} from '../logic';
</script>

<style scoped src="../theme/home.css"></style>