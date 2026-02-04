/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                satoshi: ['Satoshi', 'system-ui', 'sans-serif'],
            },
            screens: {
                ultrawide: '2000px',
            },
        },
    },
    plugins: [],
}