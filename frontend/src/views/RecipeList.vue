<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import RecipeServices from "../services/RecipeServices.js";
import Utils from "../config/utils.js";

const CATEGORIES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Dessert",
  "Snack",
  "Other",
];

const router = useRouter();
const recipes = ref([]);
const loading = ref(false);
const error = ref("");
const search = ref("");
const addOpen = ref(false);
const deleteOpen = ref(false);
const addLoading = ref(false);
const addError = ref("");
const addForm = ref(null);
const deleteTarget = ref(null);

const addRecipe = ref({
  name: "",
  servings: "",
  time: "",
  category: null,
  photo: null,
});

const nameRules = [
  (v) => !!String(v ?? "").trim() || "Recipe name is required.",
];
const servingsRules = [
  (v) =>
    v === "" ||
    v === null ||
    v === undefined ||
    (Number.isInteger(Number(v)) && Number(v) >= 1) ||
    "Servings must be at least 1.",
];
const timeRules = [
  (v) =>
    v === "" ||
    v === null ||
    v === undefined ||
    (Number.isInteger(Number(v)) && Number(v) >= 1) ||
    "Cook time must be at least 1 minute.",
];

const filteredRecipes = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) {
    return recipes.value;
  }
  return recipes.value.filter((recipe) =>
    recipe.name.toLowerCase().includes(q)
  );
});

const emptyMessage = computed(() => {
  if (recipes.value.length === 0) {
    return "No recipes yet. Create your first recipe.";
  }
  if (filteredRecipes.value.length === 0) {
    return "No recipes match your search.";
  }
  return "";
});

async function loadRecipes() {
  error.value = "";
  loading.value = true;
  try {
    const res = await RecipeServices.getRecipes();
    recipes.value = res.data;
  } catch {
    error.value = "Unable to load recipes.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadRecipes);

function openAdd() {
  addError.value = "";
  addRecipe.value = {
    name: "",
    servings: "",
    time: "",
    category: null,
    photo: null,
  };
  addOpen.value = true;
}

function closeAdd() {
  addOpen.value = false;
}

function openRecipe(recipe) {
  router.push({ name: "recipe", params: { id: recipe.id } });
}

function editRecipe(recipe) {
  router.push({ name: "editRecipe", params: { id: recipe.id } });
}

function openDelete(recipe) {
  deleteTarget.value = recipe;
  deleteOpen.value = true;
}

function cancelDelete() {
  deleteOpen.value = false;
  deleteTarget.value = null;
}

async function confirmDelete() {
  if (!deleteTarget.value) {
    return;
  }
  try {
    await RecipeServices.deleteRecipe(deleteTarget.value.id);
    deleteOpen.value = false;
    deleteTarget.value = null;
    await loadRecipes();
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to load recipes.";
  }
}

function payloadFromAdd() {
  const body = { name: addRecipe.value.name.trim() };
  if (addRecipe.value.servings !== "" && addRecipe.value.servings != null) {
    body.servings = Number(addRecipe.value.servings);
  }
  if (addRecipe.value.time !== "" && addRecipe.value.time != null) {
    body.time = Number(addRecipe.value.time);
  }
  if (addRecipe.value.category) {
    body.category = addRecipe.value.category;
  }
  return body;
}

async function submitAdd() {
  addError.value = "";
  const { valid } = await addForm.value.validate();
  if (!valid) {
    return;
  }
  addLoading.value = true;
  try {
    const created = await RecipeServices.addRecipe(payloadFromAdd());
    const file = Array.isArray(addRecipe.value.photo)
      ? addRecipe.value.photo[0]
      : addRecipe.value.photo;
    if (file) {
      await RecipeServices.uploadRecipeImage(created.data.id, file);
    }
    addOpen.value = false;
    await loadRecipes();
  } catch (err) {
    addError.value =
      err.response?.data?.message || "Unable to create recipe.";
  } finally {
    addLoading.value = false;
  }
}
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <h1 class="text-h5 text-primary">My Recipes</h1>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAdd"
          >
            + Add Recipe
          </v-btn>
        </div>
        <v-text-field
          v-model="search"
          label="Search recipes"
          placeholder="Search recipes"
          density="comfortable"
          rounded="lg"
          class="mb-4"
          clearable
        />
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />
        <v-alert
          v-if="error"
          type="error"
          density="compact"
          class="mb-4"
        >
          {{ error }}
        </v-alert>
        <p v-if="!loading && emptyMessage" class="text-medium-emphasis">
          {{ emptyMessage }}
        </p>
        <v-list v-else-if="!loading">
          <v-list-item
            v-for="recipe in filteredRecipes"
            :key="recipe.id"
            class="px-0"
          >
            <template #prepend>
              <v-avatar
                v-if="Utils.recipeImageUrl(recipe.imagePath)"
                rounded="lg"
                size="48"
              >
                <v-img :src="Utils.recipeImageUrl(recipe.imagePath)" cover />
              </v-avatar>
            </template>
            <v-list-item-title>
              <a href="#" class="text-primary" @click.prevent="openRecipe(recipe)">
                {{ recipe.name }}
              </a>
            </v-list-item-title>
            <v-list-item-subtitle v-if="recipe.category">
              <v-chip size="small" class="mt-1">{{ recipe.category }}</v-chip>
            </v-list-item-subtitle>
            <template #append>
              <v-btn
                icon="mdi-pencil"
                variant="text"
                size="small"
                aria-label="Edit recipe"
                @click="editRecipe(recipe)"
              />
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                aria-label="Delete recipe"
                @click="openDelete(recipe)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>

    <v-dialog v-model="addOpen" max-width="520" persistent>
      <v-card rounded="lg">
        <v-card-item>
          <v-card-title class="text-primary">Add Recipe</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-alert
            v-if="addError"
            type="error"
            density="compact"
            class="mb-4"
          >
            {{ addError }}
          </v-alert>
          <v-form ref="addForm" @submit.prevent="submitAdd">
            <v-text-field
              v-model="addRecipe.name"
              label="Name"
              name="name"
              density="comfortable"
              rounded="lg"
              :rules="nameRules"
            />
            <v-text-field
              v-model="addRecipe.servings"
              label="Servings"
              name="servings"
              type="number"
              density="comfortable"
              rounded="lg"
              :rules="servingsRules"
            />
            <v-text-field
              v-model="addRecipe.time"
              label="Time (minutes)"
              name="time"
              type="number"
              density="comfortable"
              rounded="lg"
              :rules="timeRules"
            />
            <v-select
              v-model="addRecipe.category"
              :items="CATEGORIES"
              label="Category"
              name="category"
              density="comfortable"
              rounded="lg"
              clearable
            />
            <v-file-input
              v-model="addRecipe.photo"
              label="Photo"
              accept="image/jpeg,image/png"
              density="comfortable"
              rounded="lg"
            />
            <div class="d-flex justify-end ga-2 mt-2">
              <v-btn color="secondary" variant="text" @click="closeAdd">
                Cancel
              </v-btn>
              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                class="oc-cta"
                :loading="addLoading"
              >
                Add Recipe
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="400" persistent>
      <v-card rounded="lg">
        <v-card-text class="pt-6">Delete this recipe?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="cancelDelete">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
