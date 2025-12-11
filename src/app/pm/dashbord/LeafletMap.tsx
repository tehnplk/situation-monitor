"use client";

import React, { useEffect, useRef } from "react";

type StationForMap = {
  name: string;
  pm25: number;
  level: string;
  lat: number;
  lng: number;
  status?: string;
  lastUpdate?: string | null;
};

type DataSource = "mock" | "air4thai";

type LeafletMapProps = {
  stations: StationForMap[];
  source: DataSource;
  onSourceChange?: (source: DataSource) => void;
  loading?: boolean;
};

const LeafletMap: React.FC<LeafletMapProps> = ({ stations, source, onSourceChange, loading }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

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
        if ((window as any).L) {
          resolve();
          return;
        }

        const existing = document.querySelector<HTMLScriptElement>(
          'script[data-leaflet="true"]',
        );

        if (existing) {
          existing.addEventListener(
            "load",
            () => resolve(),
            { once: true },
          );
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

    ensureLeafletCss();

    let cancelled = false;

    ensureLeafletScript()
      .then(() => {
        if (cancelled || !mapContainerRef.current) return;
        const L = (window as any).L;
        if (!L) return;

        let map = mapInstanceRef.current;

        if (!map) {
          map = L.map(mapContainerRef.current);
          mapInstanceRef.current = map;

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
          }).addTo(map);
        }

        if (markersRef.current.length > 0) {
          markersRef.current.forEach((marker) => {
            try {
              map.removeLayer(marker);
            } catch {}
          });
          markersRef.current = [];
        }

        stations.forEach((station) => {
          if (typeof station.lat !== "number" || typeof station.lng !== "number") {
            return;
          }

          const color =
            station.pm25 <= 25
              ? "#22c55e"
              : station.pm25 <= 50
              ? "#eab308"
              : station.pm25 <= 75
              ? "#f97316"
              : "#ef4444";

          const marker = L.circleMarker([station.lat, station.lng], {
            radius: 10,
            color,
            fillColor: color,
            fillOpacity: 0.85,
            weight: 2,
          }).addTo(map);

          markersRef.current.push(marker);

          const safeName = station.name || "ไม่ทราบชื่อสถานี";
          const safeLevel = station.level || "ไม่ทราบระดับ";
          const safeStatus = station.status || "ออนไลน์";
          const safeLastUpdate = station.lastUpdate || "ไม่ทราบเวลาอัปเดต";

          marker.bindPopup(
            `<strong>${safeName}</strong>` +
              `<br/>PM2.5: ${station.pm25} µg/m³` +
              `<br/>ระดับ: ${safeLevel}` +
              `<br/>สถานี: ${safeStatus}` +
              `<br/>อัปเดตล่าสุด: ${safeLastUpdate}`,
          );

          marker.bindTooltip(
            `${station.pm25}`,
            {
              permanent: true,
              direction: "top",
              offset: [0, -12],
              className: "pm-station-label",
            },
          );
        });

        if (stations.length > 0) {
          if (source === "air4thai") {
            const validLatLng = stations
              .filter(
                (s) =>
                  typeof s.lat === "number" &&
                  !Number.isNaN(s.lat) &&
                  typeof s.lng === "number" &&
                  !Number.isNaN(s.lng),
              )
              .map((s) => [s.lat, s.lng] as [number, number]);

            if (validLatLng.length > 0) {
              const bounds = L.latLngBounds(validLatLng);
              map.fitBounds(bounds, { padding: [32, 32] });
            } else {
              map.setView([16.8212, 100.2659], 9);
            }
          } else {
            map.setView([16.8212, 100.2659], 9);
          }
        } else {
          map.setView([16.8212, 100.2659], 9);
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
  }, [stations, source]);

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white/90 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-emerald-950">
            แผนที่ค่าฝุ่น PM2.5 จังหวัดพิษณุโลก
          </h2>
          <p className="mt-1 text-xs text-emerald-800/80">
            แผนที่ตัวอย่างด้วย Leaflet (ข้อมูลจำลอง) แสดงระดับ PM2.5 ตามพื้นที่หลัก
          </p>
        </div>
        {onSourceChange && (
          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 p-1 text-[11px] font-medium text-emerald-800">
            <button
              type="button"
              onClick={() => onSourceChange("mock")}
              className={
                "rounded-full px-2.5 py-1 transition " +
                (source === "mock"
                  ? "bg-emerald-600 text-white shadow"
                  : "hover:bg-emerald-100")
              }
            >
              Mock
            </button>
            <button
              type="button"
              onClick={() => onSourceChange("air4thai")}
              className={
                "rounded-full px-2.5 py-1 transition " +
                (source === "air4thai"
                  ? "bg-emerald-600 text-white shadow"
                  : "hover:bg-emerald-100")
              }
            >
              Air4Thai
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 h-72 w-full overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 relative">
        <div ref={mapContainerRef} className="h-full w-full" />
        {loading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-emerald-50/40 text-xs font-medium text-emerald-900">
            กำลังโหลดข้อมูลจาก Air4Thai...
          </div>
        )}
      </div>
    </div>
  );
};

export default LeafletMap;
