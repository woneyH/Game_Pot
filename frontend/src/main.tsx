import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import HomePage from "./pages/HomePage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HomePage />
  </StrictMode>
);
