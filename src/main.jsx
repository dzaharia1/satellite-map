import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import SatellitePage from "./components/SatellitePage.jsx";
import { trackedSatellites } from "./satellites.js";

// /iss, /hubble, ... each with optional /no-animate or /:coordinates
const satelliteRoutes = Object.entries(trackedSatellites).flatMap(
  ([slug, satellite]) => [
    { path: `/${slug}`, element: <SatellitePage satellite={satellite} /> },
    {
      path: `/${slug}/no-animate`,
      element: <SatellitePage satellite={satellite} />,
    },
    {
      path: `/${slug}/:coordinates`,
      element: <SatellitePage satellite={satellite} />,
    },
  ]
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/no-animate",
    element: <App />,
  },
  ...satelliteRoutes,
  {
    path: "/*",
    element: <App />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
