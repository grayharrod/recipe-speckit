<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import RecipeServices from "../services/RecipeServices.js";
import IngredientServices from "../services/IngredientServices.js";
import Utils from "../config/utils.js";
import { CATEGORIES, UNITS } from "../config/recipeConstants.js";

const route = useRoute();
const router = useRouter();
const recipe = ref({
  name: "",
  description: "",
  servings: "",
  time: "",
  category: null,
  imagePath: null,
  recipeStep: [],
  recipeIngredient: [],
});
const ingredients = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const form = ref(null);

const selectedIngredientId = ref(null);
const quantity = ref("");
const newIngredientName = ref("");
const newIngredientUnit = ref("cup");
const newStepInstruction = ref("");
const photo = ref(null);
const attachError = ref("");

const nameRules = [
  (v) => !!String(v ?? "").trim() || "Recipe name is required.",
];
const descriptionRules = [
  (v) => !!String(v ?? "").trim() || "Description is required.",
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

const ingredientOptions = computed(() =>
  ingredients.value.map((item) => ({
    title: `${item.name} (${item.unit})`,
    value: item.id,
  }))
);

const imageSrc = computed(() => Utils.recipeImageUrl(recipe.value?.imagePath));

function goHome() {
  router.push({ name: "home" });
}

function ingredientLine(row) {
  const unit = row.ingredient?.unit ?? "";
  const name = row.ingredient?.name ?? "";
  return `${row.quantity} ${unit} ${name}`.trim();
}

async function loadAll() {
  error.value = "";
  loading.value = true;
  try {
    const [recipeRes, ingredientRes] = await Promise.all([
      RecipeServices.getRecipe(route.params.id),
      IngredientServices.getIngredients(),
    ]);
    recipe.value = {
      ...recipeRes.data,
      servings: recipeRes.data.servings ?? "",
      time: recipeRes.data.time ?? "",
      category: recipeRes.data.category ?? null,
      recipeStep: recipeRes.data.recipeStep ?? [],
      recipeIngredient: recipeRes.data.recipeIngredient ?? [],
    };
    ingredients.value = ingredientRes.data;
  } catch {
    error.value = "Unable to load recipe.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadAll);

function savePayload() {
  const body = {
    name: recipe.value.name.trim(),
    description: recipe.value.description.trim(),
  };
  if (recipe.value.servings !== "" && recipe.value.servings != null) {
    body.servings = Number(recipe.value.servings);
  }
  if (recipe.value.time !== "" && recipe.value.time != null) {
    body.time = Number(recipe.value.time);
  }
  if (recipe.value.category) {
    body.category = recipe.value.category;
  }
  return body;
}

async function saveRecipe() {
  error.value = "";
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }
  saving.value = true;
  try {
    await RecipeServices.updateRecipe(route.params.id, savePayload());
    const file = Array.isArray(photo.value) ? photo.value[0] : photo.value;
    if (file) {
      await RecipeServices.uploadRecipeImage(route.params.id, file);
    }
    router.push({ name: "recipe", params: { id: route.params.id } });
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to save recipe.";
  } finally {
    saving.value = false;
  }
}

async function addPrivateIngredient() {
  error.value = "";
  if (!newIngredientName.value.trim()) {
    error.value = "Ingredient name is required.";
    return;
  }
  try {
    const res = await IngredientServices.addIngredient({
      name: newIngredientName.value.trim(),
      unit: newIngredientUnit.value,
    });
    ingredients.value = [...ingredients.value, res.data];
    selectedIngredientId.value = res.data.id;
    newIngredientName.value = "";
  } catch (err) {
    error.value =
      err.response?.data?.message || "Unable to add ingredient.";
  }
}

async function attachIngredient() {
  attachError.value = "";
  if (quantity.value === "" || quantity.value == null || Number(quantity.value) <= 0) {
    attachError.value = "Quantity is required.";
    return;
  }
  if (!selectedIngredientId.value) {
    attachError.value = "Quantity is required.";
    return;
  }
  try {
    const res = await RecipeServices.addRecipeIngredient({
      recipeId: route.params.id,
      ingredientId: selectedIngredientId.value,
      quantity: Number(quantity.value),
    });
    recipe.value.recipeIngredient = [
      ...(recipe.value.recipeIngredient ?? []),
      res.data,
    ];
    quantity.value = "";
  } catch (err) {
    error.value =
      err.response?.data?.message || "Unable to add ingredient.";
  }
}

async function removeIngredient(row) {
  await RecipeServices.deleteRecipeIngredient({
    recipeId: route.params.id,
    id: row.id,
  });
  recipe.value.recipeIngredient = recipe.value.recipeIngredient.filter(
    (item) => item.id !== row.id
  );
}

async function addStep() {
  if (!newStepInstruction.value.trim()) {
    error.value = "Instruction is required.";
    return;
  }
  const res = await RecipeServices.addRecipeStep({
    recipeId: route.params.id,
    instruction: newStepInstruction.value.trim(),
  });
  recipe.value.recipeStep = [...(recipe.value.recipeStep ?? []), res.data];
  newStepInstruction.value = "";
}

async function saveStep(step) {
  const res = await RecipeServices.updateRecipeStep({
    recipeId: route.params.id,
    id: step.id,
    instruction: step.instruction,
  });
  step.instruction = res.data.instruction;
}

async function removeStep(step) {
  await RecipeServices.deleteRecipeStep({
    recipeId: route.params.id,
    id: step.id,
  });
  recipe.value.recipeStep = recipe.value.recipeStep.filter(
    (item) => item.id !== step.id
  );
}
</script>

<template>
  <v-container>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />
    <v-alert v-if="error" type="error" density="compact" class="mb-4">
      {{ error }}
    </v-alert>
    <v-btn
      color="secondary"
      variant="text"
      class="mb-2 px-0"
      prepend-icon="mdi-arrow-left"
      @click="goHome"
    >
      Back to My Recipes
    </v-btn>
    <v-form v-if="!loading" ref="form" @submit.prevent="saveRecipe">
      <h1 class="text-h5 text-primary mb-4">Edit recipe</h1>
      <v-img
        v-if="imageSrc"
        :src="imageSrc"
        max-height="240"
        class="mb-4 rounded-lg"
        cover
      />
      <v-text-field
        v-model="recipe.name"
        label="Name"
        name="name"
        density="comfortable"
        rounded="lg"
        :rules="nameRules"
      />
      <v-textarea
        v-model="recipe.description"
        label="Description"
        name="description"
        density="comfortable"
        rounded="lg"
        :rules="descriptionRules"
      />
      <v-text-field
        v-model="recipe.servings"
        label="Servings"
        name="servings"
        type="number"
        density="comfortable"
        rounded="lg"
        :rules="servingsRules"
      />
      <v-text-field
        v-model="recipe.time"
        label="Time (minutes)"
        name="time"
        type="number"
        density="comfortable"
        rounded="lg"
        :rules="timeRules"
      />
      <v-select
        v-model="recipe.category"
        :items="CATEGORIES"
        label="Category"
        density="comfortable"
        rounded="lg"
        clearable
      />
      <v-file-input
        v-model="photo"
        label="Photo"
        accept="image/jpeg,image/png"
        density="comfortable"
        rounded="lg"
      />
      <v-btn
        type="submit"
        color="primary"
        variant="elevated"
        class="oc-cta mb-8"
        :loading="saving"
      >
        Save Recipe
      </v-btn>

      <h2 class="text-h6 text-primary">Ingredients</h2>
      <ul class="mb-4">
        <li
          v-for="row in recipe.recipeIngredient"
          :key="row.id"
          class="d-flex align-center mb-2"
        >
          <span>{{ ingredientLine(row) }}</span>
          <v-btn
            icon="mdi-delete"
            variant="text"
            size="small"
            aria-label="Remove ingredient"
            @click="removeIngredient(row)"
          />
        </li>
      </ul>
      <v-select
        v-model="selectedIngredientId"
        :items="ingredientOptions"
        label="Ingredients"
        density="comfortable"
        rounded="lg"
      />
      <v-text-field
        v-model="quantity"
        label="Quantity"
        name="quantity"
        type="number"
        density="comfortable"
        rounded="lg"
      />
      <p v-if="attachError" class="text-error mb-2">{{ attachError }}</p>
      <v-btn
        color="primary"
        variant="elevated"
        class="oc-cta mb-4"
        @click="attachIngredient"
      >
        Add
      </v-btn>
      <v-text-field
        v-model="newIngredientName"
        label="New ingredient name"
        name="newIngredientName"
        density="comfortable"
        rounded="lg"
      />
      <v-select
        v-model="newIngredientUnit"
        :items="UNITS"
        label="Unit"
        density="comfortable"
        rounded="lg"
      />
      <v-btn
        color="primary"
        variant="elevated"
        class="oc-cta mb-8"
        @click="addPrivateIngredient"
      >
        Add ingredient
      </v-btn>

      <h2 class="text-h6 text-primary">Steps</h2>
      <div
        v-for="step in recipe.recipeStep"
        :key="step.id"
        class="d-flex align-center mb-2"
      >
        <span class="mr-2">{{ step.stepNumber }}.</span>
        <v-text-field
          v-model="step.instruction"
          density="comfortable"
          rounded="lg"
          hide-details
          @change="saveStep(step)"
        />
        <v-btn
          icon="mdi-delete"
          variant="text"
          size="small"
          aria-label="Remove step"
          @click="removeStep(step)"
        />
      </div>
      <v-text-field
        v-model="newStepInstruction"
        label="Instruction"
        name="instruction"
        density="comfortable"
        rounded="lg"
      />
      <v-btn
        color="primary"
        variant="elevated"
        class="oc-cta"
        @click="addStep"
      >
        Add Step
      </v-btn>
    </v-form>
  </v-container>
</template>
