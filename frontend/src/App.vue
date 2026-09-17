<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import MenuBar from "./components/MenuBar.vue";

const route = useRoute();
const hideMenu = computed(() =>
  ["login", "register"].includes(route.name)
);
</script>

<template>
  <v-app>
    <MenuBar v-if="!hideMenu" :key="route.fullPath" />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
