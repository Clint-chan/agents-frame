/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        'chat-user': '#e0f2fe',
        'chat-ai': '#f5f5f5',
        'chat-tool': '#fef3c7',
        // Design tokens to mirror reference styles
        'background': '#ffffff',
        'foreground': '#111827',
        'muted': '#f8fafc',
        'muted-foreground': '#6b7280',
        'border': '#e5e7eb'
      }
    }
  },
  plugins: []
}