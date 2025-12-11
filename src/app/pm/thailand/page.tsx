"use client";

import React, { useEffect, useRef, useState } from "react";

type Air4ThaiStation = {
  stationID: string | null;
  nameTH: string | null;
  areaTH: string | null;
  provinceTH: string | null;
  lat: number | null;
  lng: number | null;
  pm25: number | null;
  level: string | null;
  status: string | null;
  lastUpdate: string | null;
};

type MapStation = {
  name: string;
  province: string | null;
  pm25: number;
  level: string;
  lat: number;
  lng: number;
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
    if ((window as any).L) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-leaflet="true"]',
    );

    if (existing) {
      existing.remove();
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

export default function ThailandPmMapPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);

  const [stations, setStations] = useState<MapStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [apiRes] = await Promise.all([
          fetch("/api/pm/thailand"),
        ]);

        if (!apiRes.ok) {
          throw new Error("Failed to fetch /api/pm/thailand");
        }

        const data = (await apiRes.json()) as { stations?: Air4ThaiStation[] };
        const rawStations = Array.isArray(data?.stations) ? data.stations : [];

        const mapped: MapStation[] = rawStations
          .map((s) => {
            if (s.lat == null || s.lng == null || s.pm25 == null) return null;

            const name = s.areaTH ?? s.nameTH ?? "ไม่ทราบชื่อสถานี";
            const level = s.level ?? "ปานกลาง";

            return {
              name,
              province: s.provinceTH,
              pm25: s.pm25,
              level,
              lat: s.lat,
              lng: s.lng,
            } satisfies MapStation;
          })
          .filter((s): s is MapStation => s !== null);

        if (!cancelled) {
          setStations(mapped);
        }
      } catch (err) {
        if (!cancelled) {
          setError("ไม่สามารถโหลดข้อมูลจาก Air4Thai (ทั้งประเทศ) ได้");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    ensureLeafletCss();

    let cancelled = false;

    ensureLeafletScript()
      .then(() => {
        if (cancelled || !mapContainerRef.current) return;
        const L = (window as any).L;
        if (!L) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current).setView([15, 101], 5);
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

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
          }).addTo(map);

          const provinceLabel = station.province
            ? station.province
            : "ไม่ทราบจังหวัด";

          marker.bindTooltip(
            `${provinceLabel} – PM2.5: ${station.pm25.toFixed(1)} µg/m³`,
            {
              permanent: false,
              direction: "top",
              offset: [0, -8],
              className: "pm-station-label",
            },
          );
        });
      })
      .catch(() => {
        // swallow error, handled by API error state
      });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 text-emerald-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 lg:gap-8 lg:pt-10">
        <header className="flex flex-col gap-4 border-b border-emerald-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Air4Thai Nationwide
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl">
              แผนที่ค่าฝุ่น PM2.5 ทั่วประเทศไทย (Air4Thai)
            </h1>
            <p className="mt-1 text-sm text-emerald-900/80">
              ดึงข้อมูลแบบเรียลไทม์จาก Air4Thai แสดงค่าฝุ่น PM2.5 รายสถานีทั่วประเทศ
            </p>
          </div>
        </header>

        <main className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
              {error}
            </div>
          )}

          <div className="relative h-[540px] overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
            <div ref={mapContainerRef} className="h-full w-full" />
            {loading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-emerald-50/60 text-sm font-medium text-emerald-900">
                กำลังโหลดข้อมูลจาก Air4Thai ทั่วประเทศ...
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
