<script setup>
import { computed } from "vue";
import Utils from "../config/utils.js";

const user = computed(() => Utils.getStore("user"));
</script>

<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6">
        <v-card rounded="lg" class="pa-6">
          <v-card-title class="text-h5 text-primary">
            Welcome, {{ user?.fName || "chef" }}
          </v-card-title>
          <v-card-text>
            You are signed in.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
