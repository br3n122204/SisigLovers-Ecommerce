import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#0A101E",
        foreground: "#B8C7F9",
        primary: {
          DEFAULT: "#EE4D2D", // DPT ONE Orange - Keep original
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: "#1976D2", // blue highlight
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: "#11182A",
        sidebar: "#151B2B",
        // DPT ONE-specific colors
        dptone: {
          orange: "#EE4D2D",
          red: "#D0011B",
          pink: "#FF6B9D",
          blue: "#1976D2", // Keep original blue
          green: "#00BFA5",
        },
        tecovas: {
          background: '#FAF9F6',
          text: '#001F3F', // Keep dark blue text
          accent: '#F5C16C',
          border: '#E5E5E5',
          button: '#222222', // Keep original
        },
        badge: {
          pending: '#FFF9C4', // yellow
          processing: '#BBDEFB', // blue
          shipped: '#F8BBD0', // pink
          delivered: '#C8E6C9', // green
        },
        badgeText: {
          pending: '#7B7300',
          processing: '#0D47A1',
          shipped: '#AD1457',
          delivered: '#1B5E20',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
