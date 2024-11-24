import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import PrayerTimes from "./PrayerTimes";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
    <PrayerTimes />
  </StrictMode>
);
