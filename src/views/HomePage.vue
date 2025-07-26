// ======================= ScanManager.vue =======================
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="showFilterAlert = true" v-if="filteredBarcodes.length > 0">
            <ion-label style="margin-right: 5px;">Filter</ion-label>
            <ion-badge v-if="filterActive" color="danger" slot="end" style="font-size: 10px;">1</ion-badge>
          </ion-button>
        </ion-buttons>

        <ion-title class="ion-text-center">ScanManager</ion-title>

        <ion-buttons slot="end">
          <ion-button v-if="filteredBarcodes.length > 0" @click="toggleEditMode">
            {{ editMode ? 'Cancel' : 'Edit' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Barcode‑Liste -->
      <ion-list v-if="filteredBarcodes.length > 0">
        <ion-item-sliding v-for="barcode in filteredBarcodes" :key="barcode.id" :disabled="editMode">
          <!-- Slide‑Option links -->
          <ion-item-options side="start">
            <ion-item-option color="danger" expandable @click="deleteBarcode(barcode.id)">
              <ion-icon name="trash-outline" class="option-icon" />
            </ion-item-option>
          </ion-item-options>

          <!-- Haupt‑Item -->
          <ion-item button :detail="false"
            @click="editMode ? toggleSelection(barcode.id) : handleBarcodeClick(barcode)">
            <!-- Checkbox im Bearbeitungsmodus -->
            <ion-checkbox v-if="editMode" slot="start" :checked="selectedIds.includes(barcode.id)" @click.stop
              @ionChange="toggleSelection(barcode.id)"></ion-checkbox>

            <ion-label class="ion-text-wrap">
              <div style="display: flex; flex-direction: column;">
                <h2>{{ barcode.displayValue }}</h2>
                <p v-if="barcode.scannedAt" style="margin-top: 4px; color: var(--ion-color-medium); font-size: 14px;">
                  {{ formatDate(barcode.scannedAt) }}
                </p>
                <div v-if="expandedIds.includes(barcode.id)" style="margin-top: 6px;">
                  <p style="margin-top: 4px; color: var(--ion-color-medium); font-size: 14px;">Format: {{ barcode.format
                    }}</p>
                  <p style="margin-top: 4px; color: var(--ion-color-medium); font-size: 14px;">Type: {{
                    barcode.valueType }}</p>
                </div>
              </div>
            </ion-label>

            <!-- Info‑Button -->
            <ion-buttons slot="end" v-if="!editMode">
              <ion-button fill="clear" @click.stop="toggleDetails(barcode.id)">
                <ion-icon name="information-circle-outline" />
              </ion-button>
            </ion-buttons>
          </ion-item>

          <!-- Slide‑Optionen rechts -->
          <ion-item-options side="end">
            <ion-item-option color="success" @click="copyToClipboard(barcode.displayValue)">
              <ion-icon name="copy-outline" class="option-icon" />
            </ion-item-option>
            <ion-item-option color="tertiary" @click="shareBarcode(barcode.displayValue)">
              <ion-icon name="share-outline" class="option-icon" />
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <!-- Kein Barcode -->
      <div v-else class="no-entry">
        <ion-icon name="close-circle-outline" />
        <ion-label>No codes scanned.</ion-label>
      </div>

      <div v-if="editMode" class="edit-toolbar">
        <ion-button @click="toggleSelectAll">
          {{ allSelected ? 'Deselect all' : 'Select all' }}
        </ion-button>

        <ion-button color="danger" :disabled="selectedIds.length === 0" @click="requestDeleteSelected">
          Delete ({{ selectedIds.length }})
        </ion-button>
      </div>

      <!-- Alerts -->
      <ion-alert :is-open="showFilterAlert" header="Filter by type" :inputs="activeValueTypes.map(t => ({
        type: 'checkbox',
        label: t,
        value: t,
        checked: selectedValueTypes.includes(t)
      }))" :buttons="[
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Apply',
          handler: data => {
            if (data.length === 0) {
              showFilterAlert = true;
              showFilterValidationAlert = true;
              return false;
            } else {
              selectedValueTypes.splice(0, selectedValueTypes.length, ...data);
            }
          }
        }
      ]" @didDismiss="showFilterAlert = false" />

      <ion-alert
        :is-open="showFilterValidationAlert"
        header="Invalid selection"
        message="Please select at least one type."
        :buttons="['OK']"
        @didDismiss="showFilterValidationAlert = false"
      />

      <ion-alert :is-open="showDeleteConfirmAlert" header="Confirm deletion"
        :message="`Delete ${selectedIds.length} item${selectedIds.length === 1 ? '' : 's'}?`" :buttons="[
          { text: 'Cancel', role: 'cancel', handler: () => (showDeleteConfirmAlert = false) },
          { text: 'Delete', role: 'destructive', handler: confirmDeleteSelected }
        ]" />

      <ion-alert :is-open="showFilterResetAlert" header="Filter reset"
        message="All codes are now shown because the last filtered entries were deleted." :buttons="['OK']"
        @didDismiss="showFilterResetAlert = false" />
    </ion-content>

    <!-- Footer‑Buttons -->
    <ion-footer>
      <div class="footer">
        <div class="footer-entry" @click="scanBarcode">
          <ion-icon name="barcode-outline" />
          <ion-label>Scanner</ion-label>
        </div>
        <div class="footer-entry">
          <ion-icon name="list-outline" color="primary" />
          <ion-label class="active">List</ion-label>
        </div>
        <div class="footer-entry" @click="pickFromGallery">
          <ion-icon name="image-outline" />
          <ion-label>Gallery</ion-label>
        </div>
      </div>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonList, IonItem, IonItemSliding, IonItemOptions,
  IonItemOption, IonLabel, IonButton, IonButtons, IonAlert, IonIcon, IonCheckbox, IonBadge,
} from '@ionic/vue';
import { addIcons } from 'ionicons';
import {
  barcodeOutline, listOutline, imageOutline, trashOutline,
  informationCircleOutline, copyOutline, shareOutline, closeCircleOutline,
} from 'ionicons/icons';
addIcons({
  'barcode-outline': barcodeOutline,
  'list-outline': listOutline,
  'image-outline': imageOutline,
  'trash-outline': trashOutline,
  'information-circle-outline': informationCircleOutline,
  'copy-outline': copyOutline,
  'share-outline': shareOutline,
  'close-circle-outline': closeCircleOutline,
});

import { onMounted } from 'vue';
import {
  loadBarcodes, filteredBarcodes, scanBarcode, pickFromGallery,
  copyToClipboard, shareBarcode, deleteBarcode, handleBarcodeClick,
  selectedIds, editMode, toggleEditMode, toggleSelection,
  allSelected, toggleSelectAll, expandedIds, toggleDetails, formatDate, activeValueTypes, selectedValueTypes,
  showFilterAlert, showDeleteConfirmAlert, requestDeleteSelected, confirmDeleteSelected, filterActive, showFilterResetAlert, showFilterValidationAlert,
} from '../logic';

onMounted(loadBarcodes);
</script>

<style scoped src="../theme/home.css" />