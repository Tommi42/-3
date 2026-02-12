/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            fontFamily: {
                handwriting: ['"Dancing Script"', 'cursive'],
                sans: ['"Quicksand"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
