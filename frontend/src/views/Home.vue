<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const user = computed(() => Utils.getStore("user"));

async function signOut() {
  try {
    await AuthServices.logoutUser();
  } catch {
    // Clear the local session even if the API call fails.
  }
  Utils.removeItem("user");
  window.dispatchEvent(new CustomEvent("user-logged-out"));
  router.push({ name: "login" });
}
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
          <v-card-actions>
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              @click="signOut"
            >
              Sign out
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
