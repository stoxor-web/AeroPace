import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// [https://vitejs.dev/config/](https://vitejs.dev/config/)
export default defineConfig({
  plugins: [react()],
  // AJOUTEZ CETTE LIGNE : remplacez "nom-du-repo" par le vrai nom de votre repo GitHub
  base: '/nom-du-repo/', 
})
