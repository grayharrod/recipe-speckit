<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import RecipeServices from "../services/RecipeServices.js";
import Utils from "../config/utils.js";

const route = useRoute();
const router = useRouter();
const recipe = ref(null);
const loading = ref(false);
const error = ref("");

const imageSrc = computed(() => Utils.recipeImageUrl(recipe.value?.imagePath));

const ingredientLines = computed(() => {
  const items = recipe.value?.recipeIngredient ?? [];
  return items.map((row) => {
    const unit = row.ingredient?.unit ?? "";
    const name = row.ingredient?.name ?? "";
    return `${row.quantity} ${unit} ${name}`.trim();
  });
});

const steps = computed(() =>
  [...(recipe.value?.recipeStep ?? [])].sort(
    (a, b) => a.stepNumber - b.stepNumber
  )
);

async function loadRecipe() {
  error.value = "";
  loading.value = true;
  try {
    const res = await RecipeServices.getRecipe(route.params.id);
    recipe.value = res.data;
  } catch {
    error.value = "Unable to load recipe.";
    recipe.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(loadRecipe);

function goEdit() {
  router.push({ name: "editRecipe", params: { id: route.params.id } });
}

function goHome() {
  router.push({ name: "home" });
}
</script>

<template>
  <v-container>
    <v-btn
      color="secondary"
      variant="text"
      class="mb-2 px-0"
      prepend-icon="mdi-arrow-left"
      @click="goHome"
    >
      Back to My Recipes
    </v-btn>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />
    <v-alert v-if="error" type="error" density="compact" class="mb-4">
      {{ error }}
    </v-alert>
    <v-card v-if="recipe" rounded="lg" class="pa-4">
      <div class="d-flex align-center justify-space-between mb-4">
        <h1 class="text-h5 text-primary">{{ recipe.name }}</h1>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          @click="goEdit"
        >
          Edit recipe
        </v-btn>
      </div>
      <v-img
        v-if="imageSrc"
        :src="imageSrc"
        max-height="320"
        class="mb-4 rounded-lg"
        cover
      />
      <p v-if="recipe.description?.trim()">{{ recipe.description }}</p>
      <p v-else class="text-medium-emphasis">No description yet.</p>
      <p v-if="recipe.servings">Servings: {{ recipe.servings }}</p>
      <p v-if="recipe.time">Time: {{ recipe.time }} minutes</p>
      <p v-if="recipe.category">Category: {{ recipe.category }}</p>

      <h2 class="text-h6 text-primary mt-6">Ingredients</h2>
      <p v-if="ingredientLines.length === 0" class="text-medium-emphasis">
        No ingredients yet.
      </p>
      <ul v-else>
        <li v-for="(line, index) in ingredientLines" :key="index">{{ line }}</li>
      </ul>

      <h2 class="text-h6 text-primary mt-6">Steps</h2>
      <p v-if="steps.length === 0" class="text-medium-emphasis">No steps yet.</p>
      <ol v-else>
        <li v-for="step in steps" :key="step.id">{{ step.instruction }}</li>
      </ol>
    </v-card>
  </v-container>
</template>
