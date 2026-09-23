import { Routes, Route } from "react-router-dom";
import { SiteLayout } from "../layouts/SiteLayout";
import { HomePage } from "../pages/Home/HomePage";
import { AboutPage } from "../pages/About/AboutPage";
import { ProductsPage } from "../pages/Products/ProductsPage";
import { ProductDetailsPage } from "../pages/ProductDetails/ProductDetailsPage";
import { TestimonialsPage } from "../pages/Testimonials/TestimonialsPage";
import { NewsPage } from "../pages/News/NewsPage";
import { ContactPage } from "../pages/Contact/ContactPage";
import { NotFoundPage } from "../pages/NotFound/NotFoundPage";
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:productId" element={<ProductDetailsPage />} />
        <Route path="testimonials" element={<TestimonialsPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
