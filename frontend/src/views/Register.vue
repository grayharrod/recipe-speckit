<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();
const form = ref(null);
const loading = ref(false);
const error = ref("");
const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const required = (label) => [
  (v) => !!String(v ?? "").trim() || `${label} is required.`,
];
const usernameRules = required("Username");
const passwordRules = [
  (v) => !!String(v ?? "").trim() || "Password is required.",
  (v) =>
    String(v ?? "").length >= 8 || "Password must be at least 8 characters.",
];
const confirmRules = [
  (v) => !!String(v ?? "").trim() || "Confirm password is required.",
  (v) => v === password.value || "Passwords do not match.",
];

async function createAccount() {
  error.value = "";
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const res = await AuthServices.registerUser({
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
      password: password.value,
    });
    Utils.setStore("user", res.data);
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    router.push({ name: "home" });
  } catch (err) {
    error.value =
      err.response?.data?.message || "Unable to create account. Try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6">
        <v-card rounded="lg" class="pa-4">
          <v-card-title class="text-h5 text-primary">Create account</v-card-title>
          <v-card-text>
            <v-alert
              v-if="error"
              type="error"
              density="compact"
              class="mb-4"
            >
              {{ error }}
            </v-alert>
            <v-form ref="form" @submit.prevent="createAccount">
              <v-text-field
                v-model="fName"
                label="First name"
                name="fName"
                density="comfortable"
                rounded="lg"
                :rules="required('First name')"
              />
              <v-text-field
                v-model="lName"
                label="Last name"
                name="lName"
                density="comfortable"
                rounded="lg"
                :rules="required('Last name')"
              />
              <v-text-field
                v-model="email"
                label="Email"
                name="email"
                density="comfortable"
                rounded="lg"
                :rules="emailRules"
              />
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
              <v-text-field
                v-model="confirmPassword"
                label="Confirm password"
                name="confirmPassword"
                type="password"
                density="comfortable"
                rounded="lg"
                :rules="confirmRules"
              />
              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                class="oc-cta"
                :loading="loading"
              >
                Create account
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn color="secondary" variant="text" :to="{ name: 'login' }">
              Back to sign in
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
