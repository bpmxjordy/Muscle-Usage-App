/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#6366f1',
                    light: '#818cf8',
                    dark: '#4f46e5',
                },
                secondary: {
                    DEFAULT: '#06b6d4',
                    light: '#22d3ee',
                },
                accent: {
                    DEFAULT: '#f59e0b',
                    light: '#fbbf24',
                },
                surface: {
                    DEFAULT: '#1e1b2e',
                    light: '#2a2740',
                    lighter: '#3a3650',
                },
                background: '#0f0d1a',
                success: '#10b981',
                danger: '#ef4444',
                warning: '#f59e0b',
                text: {
                    DEFAULT: '#f1f5f9',
                    muted: '#94a3b8',
                },
                border: '#334155',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
