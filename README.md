# EcoRoute Planner

A smart trip planner designed for both Electric Vehicles (EV) and Internal Combustion Engine (ICE) vehicles. This application helps users plan their journeys with route optimization and point-of-interest (POI) discovery.

## Features

-   **Multi-Vehicle Support**: Specialized planning for EVs (charging stations) and ICE vehicles (gas stations).
-   **Interactive Map**: Visual route planning with markers for start, end, and stops along the way.
-   **Smart POI Discovery**: Finds relevant stops (charging/gas) along your specific route using the Overpass API.
-   **Trip Snapshot**: Generate and download a beautiful, shareable image of your trip plan.
-   **Route Statistics**: Real-time calculation of distance, duration, and average speed.

## Tech Stack

-   **Frontend Framework**: [React](https://react.dev/) (v19) with [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Maps**: [Leaflet](https://leafletjs.com/) & [React Leaflet](https://react-leaflet.js.org/)
-   **Routing Service**: [OSRM](http://project-osrm.org/) (Open Source Routing Machine)
-   **POI Data**: [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) (OpenStreetMap data)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Image Generation**: [html2canvas](https://html2canvas.hertzen.com/)

## Getting Started

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

## Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/).

**Live Demo:** [https://route-planner-nine.vercel.app/](https://route-planner-nine.vercel.app/)

## License

© 2026 Prashant Fawade. All rights reserved.
