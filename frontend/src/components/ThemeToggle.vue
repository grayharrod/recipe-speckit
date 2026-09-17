<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useTheme } from "vuetify";
import Utils from "../config/utils.js";

const theme = useTheme();
const signedIn = ref(!!Utils.getStore("user"));

const syncSignedIn = () => {
  signedIn.value = !!Utils.getStore("user");
};

const toggleTheme = () => {
  const next = theme.global.name.value === "dark" ? "bright" : "dark";
  theme.global.name.value = next;
  Utils.setStore("theme", next);
};

onMounted(() => {
  const stored = Utils.getStore("theme");
  if (stored === "dark" || stored === "bright") {
    theme.global.name.value = stored;
  }
  window.addEventListener("user-logged-in", syncSignedIn);
  window.addEventListener("user-logged-out", syncSignedIn);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", syncSignedIn);
  window.removeEventListener("user-logged-out", syncSignedIn);
});
</script>

<template>
  <v-btn
    v-if="signedIn"
    class="theme-toggle"
    icon
    variant="text"
    aria-label="Switch theme"
    data-testid="theme-toggle"
    @click="toggleTheme"
  >
    <v-icon>
      {{ theme.global.name.value === "dark" ? "mdi-white-balance-sunny" : "mdi-weather-night" }}
    </v-icon>
  </v-btn>
</template>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 20;
}
</style>
