<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const form = ref(null);
const loading = ref(false);
const error = ref("");
const username = ref("");
const password = ref("");

const usernameRules = [(v) => !!String(v ?? "").trim() || "Username is required."];
const passwordRules = [(v) => !!String(v ?? "").trim() || "Password is required."];

async function signIn() {
  error.value = "";
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const res = await AuthServices.loginUser({
      username: username.value.trim(),
      password: password.value,
    });
    Utils.setStore("user", res.data);
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    router.push({ name: "home" });
  } catch (err) {
    error.value =
      err.response?.data?.message || "Unable to sign in. Try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="5">
        <v-card rounded="lg" class="pa-4">
          <v-card-title class="text-h5 text-primary">Sign in</v-card-title>
          <v-card-text>
            <v-alert
              v-if="error"
              type="error"
              density="compact"
              class="mb-4"
            >
              {{ error }}
            </v-alert>
            <v-form ref="form" @submit.prevent="signIn">
              <v-text-field
                v-model="username"
                label="Username"
                name="username"
                density="comfortable"
                rounded="lg"
                :rules="usernameRules"
              />
              <v-text-field
                v-model="password"
                label="Password"
                name="password"
                type="password"
                density="comfortable"
                rounded="lg"
                :rules="passwordRules"
              />
              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                class="oc-cta"
                :loading="loading"
              >
                Sign in
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="secondary"
              variant="text"
              :to="{ name: 'register' }"
            >
              Create an account
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
