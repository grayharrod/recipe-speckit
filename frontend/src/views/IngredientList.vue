<script setup>
import { onMounted, ref } from "vue";
import IngredientServices from "../services/IngredientServices.js";
import { UNITS } from "../config/recipeConstants.js";

const ingredients = ref([]);
const loading = ref(false);
const error = ref("");
const formOpen = ref(false);
const isEdit = ref(false);
const formLoading = ref(false);
const formError = ref("");
const formRef = ref(null);
const deleteOpen = ref(false);
const deleteTarget = ref(null);
const formIngredient = ref({
  id: undefined,
  name: "",
  unit: "cup",
});

const nameRules = [
  (v) => !!String(v ?? "").trim() || "Ingredient name is required.",
];
const unitRules = [(v) => !!v || "Unit is required."];

async function loadIngredients() {
  error.value = "";
  loading.value = true;
  try {
    const res = await IngredientServices.getIngredients();
    ingredients.value = res.data;
  } catch {
    error.value = "Unable to load ingredients.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadIngredients);

function openAdd() {
  formError.value = "";
  isEdit.value = false;
  formIngredient.value = { id: undefined, name: "", unit: "cup" };
  formOpen.value = true;
}

function openEdit(item) {
  formError.value = "";
  isEdit.value = true;
  formIngredient.value = {
    id: item.id,
    name: item.name,
    unit: item.unit,
  };
  formOpen.value = true;
}

function closeForm() {
  formOpen.value = false;
}

function openDelete(item) {
  deleteTarget.value = item;
  deleteOpen.value = true;
}

function cancelDelete() {
  deleteOpen.value = false;
  deleteTarget.value = null;
}

async function submitForm() {
  formError.value = "";
  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }
  formLoading.value = true;
  const payload = {
    name: formIngredient.value.name.trim(),
    unit: formIngredient.value.unit,
  };
  try {
    if (isEdit.value) {
      await IngredientServices.updateIngredient({
        id: formIngredient.value.id,
        ...payload,
      });
    } else {
      await IngredientServices.addIngredient(payload);
    }
    formOpen.value = false;
    await loadIngredients();
  } catch (err) {
    formError.value =
      err.response?.data?.message || "Unable to save ingredient.";
  } finally {
    formLoading.value = false;
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) {
    return;
  }
  try {
    await IngredientServices.deleteIngredient(deleteTarget.value.id);
    deleteOpen.value = false;
    deleteTarget.value = null;
    await loadIngredients();
  } catch (err) {
    error.value =
      err.response?.data?.message || "Unable to load ingredients.";
  }
}
</script>

<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 text-primary">Ingredients</h1>
      <v-btn
        color="primary"
        variant="elevated"
        class="oc-cta"
        @click="openAdd"
      >
        + Add Ingredient
      </v-btn>
    </div>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />
    <v-alert v-if="error" type="error" density="compact" class="mb-4">
      {{ error }}
    </v-alert>
    <p
      v-if="!loading && ingredients.length === 0"
      class="text-medium-emphasis"
    >
      No ingredients yet. Add your first ingredient.
    </p>
    <v-table v-else-if="!loading" class="rounded-lg">
      <thead>
        <tr>
          <th class="text-left">Name</th>
          <th class="text-left">Unit</th>
          <th class="text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in ingredients" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ item.unit }}</td>
          <td>
            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="small"
              aria-label="Edit ingredient"
              @click="openEdit(item)"
            />
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              aria-label="Delete ingredient"
              @click="openDelete(item)"
            />
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="formOpen" max-width="520" persistent attach>
      <v-card rounded="lg">
        <v-card-item>
          <v-card-title class="text-primary">
            {{ isEdit ? "Edit Ingredient" : "Add Ingredient" }}
          </v-card-title>
        </v-card-item>
        <v-card-text>
          <v-alert
            v-if="formError"
            type="error"
            density="compact"
            class="mb-4"
          >
            {{ formError }}
          </v-alert>
          <v-form ref="formRef" @submit.prevent="submitForm">
            <v-text-field
              v-model="formIngredient.name"
              label="Name"
              name="name"
              density="comfortable"
              rounded="lg"
              :rules="nameRules"
            />
            <v-select
              v-model="formIngredient.unit"
              :items="UNITS"
              label="Unit"
              name="unit"
              density="comfortable"
              rounded="lg"
              :rules="unitRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeForm">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="formLoading"
            @click="submitForm"
          >
            {{ isEdit ? "Save Ingredient" : "Add Ingredient" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="420" persistent attach>
      <v-card rounded="lg">
        <v-card-item>
          <v-card-title class="text-primary">Delete this ingredient?</v-card-title>
        </v-card-item>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="cancelDelete">
            Cancel
          </v-btn>
          <v-btn color="error" variant="elevated" class="oc-cta" @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
