import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
const adminSlash = (): Plugin => ({
  name: "admin-trailing-slash",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = new URL(req.url || "/", "http://localhost");
      if (url.pathname === "/admin") {
        res.writeHead(302, { Location: "/admin/" + url.search });
        res.end();
        return;
      }
      next();
    });
  },
});
export default defineConfig({
  plugins: [adminSlash(), react()],
  base: "/admin/",
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": process.env.API_TARGET || "http://127.0.0.1:3000",
      "/uploads": process.env.API_TARGET || "http://127.0.0.1:3000",
      "/Asset": process.env.WEB_TARGET || "http://127.0.0.1:5173",
      "/images": process.env.WEB_TARGET || "http://127.0.0.1:5173",
    },
  },
});
