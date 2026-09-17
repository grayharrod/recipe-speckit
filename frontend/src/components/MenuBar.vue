<script setup>
import ocLogo from "/oc_logo.png";
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices";
import UserServices from "../services/UserServices";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();

const user = ref(null);
const title = ref("Recipes");
const logoURL = ref("");
const editDialog = ref(false);
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

const passwordRules = [
  (v) =>
    !String(v ?? "") ||
    String(v).length >= 8 ||
    "Password must be at least 8 characters.",
];

const confirmRules = [
  (v) =>
    String(v ?? "") === String(password.value ?? "") ||
    "Passwords do not match.",
];

function refreshUser() {
  user.value = Utils.getStore("user");
}

function openEditProfile() {
  error.value = "";
  password.value = "";
  confirmPassword.value = "";
  fName.value = user.value?.fName || "";
  lName.value = user.value?.lName || "";
  email.value = user.value?.email || "";
  username.value = user.value?.username || "";
  editDialog.value = true;
}

function closeEditProfile() {
  editDialog.value = false;
  error.value = "";
  password.value = "";
  confirmPassword.value = "";
}

async function saveProfile() {
  error.value = "";
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }

  const userId = user.value?.userId ?? user.value?.id;
  if (!userId) {
    error.value = "Unable to update profile.";
    return;
  }

  const body = {
    fName: fName.value.trim(),
    lName: lName.value.trim(),
    email: email.value.trim(),
    username: username.value.trim(),
  };
  if (String(password.value ?? "").length > 0) {
    body.password = password.value;
  }

  loading.value = true;
  try {
    const res = await UserServices.updateUser(userId, body);
    const updated = res.data;
    const next = {
      ...user.value,
      userId: updated.id ?? userId,
      fName: updated.fName,
      lName: updated.lName,
      email: updated.email,
      username: updated.username,
      role: updated.role ?? user.value.role,
      token: user.value.token,
    };
    Utils.setStore("user", next);
    user.value = next;
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    closeEditProfile();
  } catch (err) {
    error.value =
      err.response?.data?.message || "Unable to update profile. Try again.";
  } finally {
    loading.value = false;
  }
}

async function logout() {
  try {
    await AuthServices.logoutUser();
  } catch {
    // Clear local session even if the API call fails.
  }
  Utils.removeItem("user");
  user.value = null;
  await router.push({ name: "login" });
}

onMounted(() => {
  logoURL.value = ocLogo;
  refreshUser();
  window.addEventListener("user-logged-in", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
});

function goIngredients() {
  router.push({ name: "ingredients" });
}

defineExpose({
  logout,
  openEditProfile,
});
</script>

<template>
  <div>
    <v-app-bar color="primary" app dark>
      <router-link :to="{ name: 'home' }">
        <v-img
          class="mx-2"
          :src="logoURL"
          height="50"
          width="50"
          contain
        ></v-img>
      </router-link>
      <v-toolbar-title class="title">
        <router-link
          :to="{ name: 'home' }"
          class="text-decoration-none text-white"
        >
          {{ title }}
        </router-link>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        v-if="user !== null"
        class="mx-2 text-white"
        variant="text"
        @click="goIngredients"
      >
        Ingredients
      </v-btn>
      <v-menu
        v-if="user !== null"
        min-width="200px"
        rounded
        :eager="true"
        attach
      >
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar class="mx-auto text-center" color="accent" size="large">
              <span class="white--text font-weight-bold">{{
                `${user.fName.charAt(0)}${user.lName.charAt(0)}`
              }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-card>
          <v-card-text>
            <div class="mx-auto text-center">
              <v-avatar color="accent">
                <span class="white--text text-h5">{{
                  `${user.fName.charAt(0)}${user.lName.charAt(0)}`
                }}</span>
              </v-avatar>
              <h3>{{ `${user.fName} ${user.lName}` }}</h3>
              <p class="text-caption mt-1">{{ user.username }}</p>
              <p class="text-caption mt-1">{{ user.email }}</p>
              <v-divider class="my-3"></v-divider>
              <v-btn
                rounded
                variant="text"
                class="oc-cta"
                @click="openEditProfile"
              >
                Edit Profile
              </v-btn>
              <v-btn rounded variant="text" @click="logout"> Log out </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-menu>
    </v-app-bar>

    <v-dialog v-model="editDialog" max-width="480" persistent :eager="true" attach>
      <v-card rounded="lg">
        <v-card-title class="text-h5 text-primary">Edit Profile</v-card-title>
        <v-card-text>
          <v-alert
            v-if="error"
            type="error"
            density="compact"
            class="mb-4"
          >
            {{ error }}
          </v-alert>
          <v-form ref="form" @submit.prevent="saveProfile">
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
              :rules="required('Username')"
            />
            <v-text-field
              v-model="password"
              label="New password (optional)"
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
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeEditProfile">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="loading"
            @click="saveProfile"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
