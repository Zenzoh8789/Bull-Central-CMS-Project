import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],server:{port:5173,strictPort:true,proxy:{'/uploads':{target:process.env.API_TARGET || 'http://127.0.0.1:3000'},'/api':{target:process.env.API_TARGET || 'http://127.0.0.1:3000',changeOrigin:false}}}});
