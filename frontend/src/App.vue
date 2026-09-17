<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import MenuBar from "./components/MenuBar.vue";
import ThemeToggle from "./components/ThemeToggle.vue";

const route = useRoute();
const hideMenu = computed(() =>
  ["login", "register", "home"].includes(route.name)
);
</script>

<template>
  <v-app>
    <MenuBar v-if="!hideMenu" :key="route.fullPath" />
    <ThemeToggle />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
