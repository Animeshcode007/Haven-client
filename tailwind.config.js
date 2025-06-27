// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // We'll stick to default black and white, but you can define shades if needed
        // e.g., 'primary-black': '#000000', 'primary-white': '#FFFFFF',
        // 'subtle-gray': '#EAEAEA'
      },
      fontFamily: {
        // Add your preferred sans-serif font here if you want to change from Tailwind's default
        // sans: ['Inter', 'sans-serif'],
      },
      // You can define your background patterns here if you prefer utility classes
      // backgroundImage: {
      //   'dashboard-pattern': "url(...your_dashboard_svg_data...)",
      //   'chat-pattern': "url(...your_chat_svg_data...)",
      // }
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // If you installed it
  ],
}