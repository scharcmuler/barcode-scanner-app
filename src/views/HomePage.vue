<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" v-if="filteredBarcodes.length > 0">
          <ion-button @click="showFilterAlert = true">
            Filter
          </ion-button>
        </ion-buttons>

        <ion-title>ScanManager</ion-title>

        <!-- Edit Button (rechts) -->
        <ion-buttons slot="end">
          <ion-button @click="toggleEditMode" v-if="filteredBarcodes.length > 0">
            {{ editMode ? 'Cancel' : 'Edit' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Barcode Liste -->
      <ion-list v-if="filteredBarcodes.length > 0">
        <ion-item-sliding v-for="(barcode, index) in filteredBarcodes" :key="index" :disabled="editMode">
          <!-- Slide‑Option links (start) -->
          <ion-item-options side="start">
            <ion-item-option color="danger" expandable @click="deleteBarcode(index)">
              <ion-icon name="trash-outline"></ion-icon>
            </ion-item-option>
          </ion-item-options>

          <!-- Haupt‑Item -->
          <ion-item button @click="editMode ? toggleSelection(index) : handleBarcodeClick(barcode)">
            <!-- Checkbox im Bearbeitungsmodus -->
            <ion-checkbox v-if="editMode" slot="start" :checked="selectedIndexes.includes(index)"
              @click.stop></ion-checkbox>

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
                <ion-icon name="information-circle-outline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-item>

          <!-- Slide‑Optionen rechts (end) -->
          <ion-item-options side="end">
            <ion-item-option expandable @click="copyToClipboard(barcode.displayValue)">
              <ion-icon name="copy-outline"></ion-icon>
            </ion-item-option>
            <ion-item-option expandable @click="shareBarcode(barcode.displayValue)">
              <ion-icon name="share-outline"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>


      
     
      <!-- Auswahlleiste im Bearbeitungsmodus -->
      <div v-if="editMode" class="edit-toolbar">
        <ion-button @click="selectAll">Select all</ion-button>
        <ion-button color="danger" @click="requestDeleteSelected" :disabled="selectedIndexes.length === 0">
          Delete ({{ selectedIndexes.length }})
        </ion-button>
      </div>
      <!-- Kein Barcode vorhanden -->
      <div v-else class="no-entry">
        <ion-icon name="close-circle-outline"></ion-icon>
        <ion-label>No codes scanned.</ion-label>
      </div>



      <ion-alert :is-open="showFilterAlert" header="Filter by type" :inputs="activeValueTypes.map(type => ({
        type: 'checkbox',
        label: type,
        value: type,
        checked: selectedValueTypes.includes(type),
      }))" :buttons="[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Apply',
            handler: (data) => {
              selectedValueTypes.splice(0, selectedValueTypes.length, ...data);
            },
          },
        ]" @didDismiss="showFilterAlert = false" />
      <ion-alert :is-open="showDeleteConfirmAlert" header="Löschen bestätigen"
        :message="`Are you sure you want to delete ${selectedIndexes.length} item${selectedIndexes.length === 1 ? '' : 's'}?`"
        :buttons="[
          {
            text: 'Abbrechen',
            role: 'cancel',
            handler: () => {
              showDeleteConfirmAlert = false;
            }
          },
          {
            text: 'Löschen',
            role: 'destructive',
            handler: confirmDeleteSelected
          }
        ]" />
    </ion-content>
    <ion-footer>
      <div class="footer">
          <div class="footer-scanner footer-entry" @click="scanBarcode">
              <ion-icon name="barcode-outline" />
              <ion-label>Scanner</ion-label>  
          </div>
          <div class="footer-list footer-entry">
            <ion-icon name="list-outline" color="primary"/>
            <ion-label>List</ion-label>
          </div>
          <div class="footer-gallery footer-entry" @click="pickFromGallery">
            <ion-icon name="images-outline" />
            <ion-label>Gallery</ion-label>
          </div>
      </div>
      </ion-footer>
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
  IonButtons,
  IonAlert,
  IonIcon,
  IonCheckbox,
} from '@ionic/vue';

import { addIcons } from 'ionicons';
import {
  barcodeOutline,
  listOutline,
  imagesOutline,
  trashOutline,
  informationCircleOutline,
  copyOutline,
  shareOutline,
  closeCircleOutline,
} from 'ionicons/icons';

addIcons({
  'barcode-outline': barcodeOutline,
  'list-outline': listOutline,
  'images-outline': imagesOutline,
  'trash-outline': trashOutline,
  'information-circle-outline': informationCircleOutline,
  'copy-outline': copyOutline,
  'share-outline': shareOutline,
  'close-circle-outline': closeCircleOutline,
});

import {onMounted } from 'vue';

import {
  loadBarcodes,
  filteredBarcodes,
  scanBarcode,
  pickFromGallery,
  copyToClipboard,
  shareBarcode,
  deleteBarcode,
  handleBarcodeClick,
  expandedIndexes,
  selectedIndexes,
  editMode,
  toggleEditMode,
  toggleSelection,
  selectAll,
  toggleDetails,
  formatDate,
  activeValueTypes,
  selectedValueTypes,
  showFilterAlert,
  showDeleteConfirmAlert,
  requestDeleteSelected,
  confirmDeleteSelected,
} from '../logic';

onMounted(() => {
  loadBarcodes();
});

</script>

<style scoped src="../theme/home.css"></style>