/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Background & Cards (Hello Barbara theme)
                app: {
                    bg: '#161616', // Deep charcoal background
                    card: '#252528', // Flat dark grey cards
                    cardHover: '#2e2e32',
                },
                // Split-color pastels
                pastel: {
                    blue: '#aab2ff',
                    orange: '#ffb28a',
                    yellow: '#ffe38a',
                    green: '#8afca6',
                },
                // Vibrant accents
                accent: {
                    blue: '#0d6cf2',
                    green: '#00e57c',
                    red: '#ff4d4d',
                    yellow: '#ffb800',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            }
        },
    },
    plugins: [],
}
