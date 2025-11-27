/** @type {import('tailwindcss').Config} */
export default {
  // Look for classes in the index.html and any JS/TS files in src
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        foxvoid: {
          
        }
      }
    },
  },
  plugins: [],
}
