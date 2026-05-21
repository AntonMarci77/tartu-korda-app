import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ut: {
          navy: "#1B365D",
          dark: "#2C5697",
          medium: "#517DB9",
          light: "#96C8E6",
          orange: "#FF5725",
          purple: "#78439E",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(27, 54, 93, 0.08), 0 4px 12px rgba(27, 54, 93, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
