"use client";

import React, { useEffect, useRef } from "react";

type LeafletLayer = {
  addTo: (map: LeafletMapInstance) => LeafletLayer;
};

type LeafletMarker = LeafletLayer & {
  bindTooltip: (
    content: string,
    options: {
      permanent: boolean;
      direction: string;
      offset: [number, number];
      className: string;
    },
  ) => void;
};

type LeafletMapInstance = {
  remove: () => void;
  removeLayer: (layer: LeafletLayer) => void;
};

type LeafletNamespace = {
  map: (container: HTMLElement) => { setView: (center: [number, number], zoom: number) => LeafletMapInstance };
  tileLayer: (
    url: string,
    options: { maxZoom: number; attribution: string },
  ) => LeafletLayer;
  circleMarker: (
    latlng: [number, number],
    options: {
      radius: number;
      color: string;
      fillColor: string;
      fillOpacity: number;
      weight: number;
    },
  ) => LeafletMarker;
};

function getLeaflet(): LeafletNamespace | null {
  const w = window as unknown as { L?: unknown };
  return w.L ? (w.L as LeafletNamespace) : null;
}

type MapStation = {
  name: string;
  province: string | null;
  pm25: number;
  level: string;
  lat: number;
  lng: number;
};

type ThailandLeafletMapClientProps = {
  stations: MapStation[];
};

const ensureLeafletCss = () => {
  const existing = document.querySelector<HTMLLinkElement>(
    'link[data-leaflet="true"]',
  );
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
  link.crossOrigin = "";
  link.dataset.leaflet = "true";
  document.head.appendChild(link);
};

const ensureLeafletScript = () =>
  new Promise<void>((resolve, reject) => {
    if (getLeaflet()) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-leaflet="true"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Leaflet script load failed")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
    script.crossOrigin = "";
    script.async = true;
    script.dataset.leaflet = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Leaflet script load failed"));
    document.body.appendChild(script);
  });

export default function ThailandLeafletMapClient({
  stations,
}: ThailandLeafletMapClientProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    ensureLeafletCss();

    let cancelled = false;

    ensureLeafletScript()
      .then(() => {
        if (cancelled || !mapContainerRef.current) return;

        const L = getLeaflet();
        if (!L) return;

        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current).setView([15, 101], 5);
          mapInstanceRef.current = map;

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
          }).addTo(map);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = getLeaflet();
    if (!map || !L) return;

    if (markersRef.current.length > 0) {
      markersRef.current.forEach((marker) => {
        try {
          map.removeLayer(marker);
        } catch {}
      });
      markersRef.current = [];
    }

    stations.forEach((station) => {
      const color =
        station.pm25 <= 25
          ? "#22c55e"
          : station.pm25 <= 50
            ? "#eab308"
            : station.pm25 <= 75
              ? "#f97316"
              : "#ef4444";

      const marker = L.circleMarker([station.lat, station.lng], {
        radius: 7,
        color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: 1.5,
      });

      marker.addTo(map);

      markersRef.current.push(marker);

      const provinceLabel = station.province ? station.province : "ไม่ทราบจังหวัด";

      marker.bindTooltip(`${provinceLabel} – PM2.5: ${station.pm25.toFixed(1)} µg/m³`, {
        permanent: false,
        direction: "top",
        offset: [0, -8],
        className: "pm-station-label",
      });
    });
  }, [stations]);

  return (
    <div className="relative h-[540px] overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
