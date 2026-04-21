import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

console.log("React app is starting...");

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("React mount requested.");
  } catch (error) {
    console.error("React render failed:", error);
  }
} else {
  console.error("Root element not found!");
}
