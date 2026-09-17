import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { createRouter, createMemoryHistory } from "vue-router";

export function createTestVuetify() {
  return createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: "bright",
      themes: {
        bright: { dark: false, colors: { primary: "#80162B" } },
        dark: { dark: true, colors: { primary: "#80162B" } },
      },
    },
  });
}

export function createTestRouter(routes) {
  return createRouter({
    history: createMemoryHistory(),
    routes,
  });
}

export async function mountView(component, { routes, initialRoute } = {}) {
  const vuetify = createTestVuetify();
  const router = createTestRouter(
    routes ?? [
      { path: "/", name: "login", component: { template: "<div>login</div>" } },
      {
        path: "/register",
        name: "register",
        component: { template: "<div>register</div>" },
      },
      { path: "/home", name: "home", component: { template: "<div>home</div>" } },
      {
        path: "/ingredients",
        name: "ingredients",
        component: { template: "<div>ingredients</div>" },
      },
      {
        path: "/recipe/:id",
        name: "recipe",
        component: { template: "<div>recipe</div>" },
      },
      {
        path: "/recipe/:id/edit",
        name: "editRecipe",
        component: { template: "<div>edit</div>" },
      },
    ]
  );
  await router.push(initialRoute ?? "/");
  await router.isReady();

  const wrapper = mount(component, {
    global: {
      plugins: [vuetify, router],
    },
  });

  return { wrapper, router, vuetify };
}
