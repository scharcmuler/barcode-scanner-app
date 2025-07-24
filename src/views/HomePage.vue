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
        <ion-item-sliding v-for="(barcode, index) in barcodes" :key="index" :disabled="editMode">
          <!-- Slide‑Option links (start) -->
          <ion-item-options side="start">
            <ion-item-option color="danger" expandable @click="deleteBarcode(index)">
              🗑️ Löschen
            </ion-item-option>
          </ion-item-options>

          <!-- Haupt‑Item -->
          <ion-item button @click="editMode ? toggleSelection(index) : handleBarcodeClick(barcode)">
            <!-- Checkbox im Bearbeitungsmodus -->
            <ion-checkbox
              v-if="editMode"
              slot="start"
              :checked="selectedIndexes.includes(index)"
              @click.stop
            ></ion-checkbox>

            <ion-label>
              <h2>{{ barcode.displayValue }}</h2>
              <p v-if="barcode.scannedAt">{{ formatDate(barcode.scannedAt) }}</p>

              <div v-if="expandedIndexes.includes(index)" class="barcode-details">
                <p>Format: {{ barcode.format }}</p>
                <p>Type: {{ barcode.valueType }}</p>
              </div>
            </ion-label>

            <!-- Info‑Button bleibt -->
            <ion-buttons slot="end" v-if="!editMode">
              <ion-button fill="clear" @click.stop="toggleDetails(index)">
                ℹ️
              </ion-button>
            </ion-buttons>
          </ion-item>

          <!-- Slide‑Optionen rechts (end) -->
          <ion-item-options side="end">
            <ion-item-option expandable @click="copyToClipboard(barcode.displayValue)">
              📋 Kopieren
            </ion-item-option>
            <ion-item-option expandable @click="shareBarcode(barcode.displayValue)">
              🔗 Teilen
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>


      <!-- Kein Barcode vorhanden -->
      <ion-grid v-else class="h-100 ion-justify-content-center ion-align-items-center">
        <ion-row>
          <ion-col size="12" class="ion-text-center">
            <ion-text color="medium" class="fw-semibold">
              Keine Einträge vorhanden.
            </ion-text>
          </ion-col>
        </ion-row>
      </ion-grid>
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
          <IonIcon :icon="logoIonic" size="large" color="medium" />
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
      <ion-alert :is-open="showSortOptions" header="Sort by" @didDismiss="showSortOptions = false" :buttons="[
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
      ]" />
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
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonButton,
  IonText,
  IonButtons,
  IonAlert,
  IonIcon,
  IonCheckbox,
} from '@ionic/vue';

  import { logoIonic } from 'ionicons/icons';
  import { defineComponent, onMounted } from 'vue';


import {
  barcodes,
  loadBarcodes,
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

onMounted(() => {
  loadBarcodes();
});

</script>

<style scoped src="../theme/home.css"></style>