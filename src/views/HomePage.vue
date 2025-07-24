<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <!-- Sort Button (links) -->
        <ion-buttons slot="start">
          <ion-button @click="showSortOptions = true">
            Sort
          </ion-button>
        </ion-buttons>

        <ion-title>Barcode Scanner</ion-title>

        <!-- Edit Button (rechts) -->
        <ion-buttons slot="end">
          <ion-button @click="toggleEditMode">
            {{ editMode ? 'Cancel' : 'Edit' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Barcode Liste -->
      <ion-list v-if="barcodes.length > 0">
        <ion-item
          v-for="(barcode, index) in barcodes"
          :key="index"
          button
          @click="!editMode && handleBarcodeClick(barcode)"
        >
          <!-- Auswahl-Knopf (links) -->
          <div
            v-if="editMode"
            class="custom-checkbox"
            :class="{ selected: selectedIndexes.includes(index) }"
            @click.stop="toggleSelection(index)"
            slot="start"
          ></div>

          <!-- Display-Wert + Info-Bereich -->
          <ion-label>
            <h2>{{ barcode.displayValue }}</h2>
            <p v-if="barcode.scannedAt">{{ formatDate(barcode.scannedAt) }}</p>

            <div v-if="expandedIndexes.includes(index)" class="barcode-details">
              <p>Format: {{ barcode.format }}</p>
              <p>Type: {{ barcode.valueType }}</p>
            </div>
          </ion-label>

          <!-- Aktionen (nur bei editMode false) -->
          <ion-buttons slot="end" v-if="!editMode">
            <ion-button fill="clear" @click.stop="toggleDetails(index)">
              ℹ️
            </ion-button>
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

      <!-- Kein Barcode vorhanden -->
      <ion-text v-else class="ion-padding">
        Noch keine Barcodes gescannt.
      </ion-text>

      <!-- Auswahlleiste im Bearbeitungsmodus -->
      <div v-if="editMode" class="edit-toolbar">
        <ion-button @click="selectAll">Alle auswählen</ion-button>
        <ion-button color="danger" @click="deleteSelected" :disabled="selectedIndexes.length === 0">
          Ausgewählte löschen ({{ selectedIndexes.length }})
        </ion-button>
      </div>

      <!-- Footer -->
      <div class="footer">
        <button class="scanner-button" @click="scanBarcode">
          <img src="../assets/scanner.png" alt="Scanner" />
          <p>Scanner</p>
        </button>
        <button class="list-button">
          <img src="../assets/list.png" alt="List" />
          <p>List</p>
        </button>
        <button class="gallery-button" @click="pickFromGallery">
          <img src="../assets/gallery.png" alt="Gallery" />
          <p>Gallery</p>
        </button>
      </div>

      <!-- Sortier-Optionen Alert -->
      <ion-alert
        :is-open="showSortOptions"
        header="Sort by"
        @didDismiss="showSortOptions = false"
        :buttons="[
          {
            text: 'Date',
            handler: () => sortBarcodes('date'),
          },
          {
            text: 'Value',
            handler: () => sortBarcodes('value'),
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]"
      />
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
  IonAlert,
} from '@ionic/vue';

import {
  barcodes,
  scanBarcode,
  pickFromGallery,
  copyToClipboard,
  shareBarcode,
  deleteBarcode,
  handleBarcodeClick,
  expandedIndexes,
  selectedIndexes,
  editMode,
  showSortOptions,
  toggleEditMode,
  toggleSelection,
  selectAll,
  deleteSelected,
  toggleDetails,
  formatDate,
  sortBarcodes,
} from '../logic';
</script>

<style scoped src="../theme/home.css"></style>