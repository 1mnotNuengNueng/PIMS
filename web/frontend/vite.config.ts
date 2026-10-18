import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Prepare the preview's lazy dependency before the first document is opened.
  optimizeDeps: { include: ['docx-preview'] },
})
