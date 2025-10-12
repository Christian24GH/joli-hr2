import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function Map({ data, className }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  const stops = data
    ?.filter((r) => r.latitude && r.longitude)
    .map((r) => [parseFloat(r.longitude), parseFloat(r.latitude)]) || [];

  useEffect(() => {
    if (!mapContainer.current || stops.length < 2) return;

    // Cleanup old map if exists
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: stops[0],
      zoom: 16,
    });

    map.current.on("load", async () => {
      // Add markers
      stops.forEach((coord, i) => {
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, closeOnClick: false })
          .setHTML(
            `<div style="border-radius:0.375rem;padding:0.5rem;color:#000;background:#fff;">${data[i].full_address}</div>`
          );

        const marker = new mapboxgl.Marker()
          .setLngLat(coord)
          .setPopup(popup)
          .addTo(map.current);

        markersRef.current.push(marker);
      });

      // Build waypoints for Mapbox Directions API
      const coordinatesString = stops.map((c) => c.join(",")).join(";");

      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const result = await response.json();

        if (result.routes && result.routes.length) {
          const route = result.routes[0].geometry;

          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: route,
            },
          });

          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#007bff", "line-width": 4 },
          });

          // Fit map to route bounds
          const bounds = new mapboxgl.LngLatBounds();
          route.coordinates.forEach((coord) => bounds.extend(coord));
          map.current.fitBounds(bounds, { padding: 50 });
        }
      } catch (err) {
        console.error("Failed to fetch route from Mapbox Directions API", err);
      }
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [stops, data]);

  return <div ref={mapContainer} className={className} />;
}

const MemoizedMap = React.memo(Map, (prev, next) => {
  return JSON.stringify(prev.data) === JSON.stringify(next.data);
});

export default MemoizedMap;
