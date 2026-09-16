import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { BackendGate } from "./components/BackendGate";
import "./styles/shell.css";
import "./styles/lesson.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BackendGate>
      <App />
    </BackendGate>
  </StrictMode>,
);
