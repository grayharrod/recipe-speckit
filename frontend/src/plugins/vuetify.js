// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Vuetify
import { createVuetify } from "vuetify";
import Utils from "../config/utils.js";

const brandColors = {
  primary: "#80162B",
  secondary: "#E1E1E1",
  accent: "#47121D",
  success: "#47121D",
  error: "#EE5044",
  teal: "#63BAC0",
  blue: "#196CA2",
  yellow: "#F8C545",
  darkblue: "#032F45",
};

const storedTheme = () => {
  const value = Utils.getStore("theme");
  return value === "dark" ? "dark" : "bright";
};

export default createVuetify({
  theme: {
    defaultTheme: storedTheme(),
    themes: {
      bright: {
        dark: false,
        colors: brandColors,
      },
      dark: {
        dark: true,
        colors: {
          ...brandColors,
          background: "#121212",
          surface: "#1E1E1E",
          secondary: "#3A3A3A",
        },
      },
    },
  },
});
