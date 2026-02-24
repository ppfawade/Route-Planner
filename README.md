# EcoRoute Planner

A smart trip planner designed for both Electric Vehicles (EV) and Internal Combustion Engine (ICE) vehicles. This application helps users plan their journeys with route optimization, point-of-interest (POI) discovery, and AI-powered trip insights.

## Features

-   **Multi-Vehicle Support**: Specialized planning for EVs (charging stations) and ICE vehicles (gas stations).
-   **Interactive Map**: Visual route planning with markers for start, end, and stops along the way.
-   **Smart POI Discovery**: Finds relevant stops (charging/gas) along your specific route using the Overpass API.
-   **AI Trip Insights**: Uses Google Gemini to provide travel advice, estimated travel times, and interesting facts about the region.
-   **Scenic Highlights**: AI-generated suggestions for major geographical features along the route.
-   **Trip Snapshot**: Generate and download a beautiful, shareable image of your trip plan.
-   **Route Statistics**: Real-time calculation of distance, duration, and average speed.

## Tech Stack

-   **Frontend Framework**: [React](https://react.dev/) (v19) with [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Maps**: [Leaflet](https://leafletjs.com/) & [React Leaflet](https://react-leaflet.js.org/)
-   **Routing Service**: [OSRM](http://project-osrm.org/) (Open Source Routing Machine)
-   **POI Data**: [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) (OpenStreetMap data)
-   **AI Integration**: [Google Gemini API](https://ai.google.dev/) (@google/genai SDK)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Image Generation**: [html2canvas](https://html2canvas.hertzen.com/)

## Getting Started

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    -   Create a `.env` file based on `.env.example`.
    -   Add your `GEMINI_API_KEY`.
4.  Run the development server:
    ```bash
    npm run dev
    ```

## Deployment

This project is optimized for deployment on [Vercel](https://vercel.com/).

## License

© 2026 Prashant Fawade. All rights reserved.
