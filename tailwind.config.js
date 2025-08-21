/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./content/**/*.md",
    "./layouts/**/*.html",
    "./static/**/*.js",
    "./assets/**/*.js",
    "./hugo_stats.json",
  ],
  darkMode: ["class", "[data-scheme='dark']"],
  plugins: [],
}