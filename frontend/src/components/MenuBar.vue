<script setup>
import ocLogo from "/oc_logo.png";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices";
import Utils from "../config/utils.js";

const router = useRouter();

const user = ref(null);
const title = ref("Recipes");
const logoURL = ref("");

onMounted(() => {
  logoURL.value = ocLogo;
  user.value = Utils.getStore("user");
});

function logout() {
  AuthServices.logoutUser().catch(() => {});
  Utils.removeItem("user");
  user.value = null;
  router.push({ name: "login" });
}

function goIngredients() {
  router.push({ name: "ingredients" });
}
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
      <v-menu v-if="user !== null" min-width="200px" rounded>
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
              <p class="text-caption mt-1">
                {{ user.email }}
              </p>
              <v-divider class="my-3"></v-divider>
              <v-btn rounded variant="text" @click="logout()"> Logout </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-menu>
    </v-app-bar>
  </div>
</template>
