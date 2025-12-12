"use client";

import React, { useEffect, useRef, useState } from "react";

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

type BaseMap = "street" | "satellite";

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
  const baseLayersRef = useRef<{ street?: any; satellite?: any; current?: any }>({});

  const [baseMap, setBaseMap] = useState<BaseMap>("street");
  const stationsRef = useRef<StationForMap[]>(stations);
  const sourceRef = useRef<DataSource>(source);
  const baseMapRef = useRef<BaseMap>(baseMap);
  const onSourceChangeRef = useRef<LeafletMapProps["onSourceChange"]>(onSourceChange);
  const sourceControlRef = useRef<any | null>(null);
  const sourceControlContainerRef = useRef<HTMLElement | null>(null);
  const sourceControlButtonsRef = useRef<{ mock?: HTMLButtonElement; air?: HTMLButtonElement }>({});
  const basemapControlRef = useRef<any | null>(null);
  const basemapControlContainerRef = useRef<HTMLElement | null>(null);
  const basemapButtonsRef = useRef<{
    toggle?: HTMLButtonElement;
    menu?: HTMLElement;
    street?: HTMLButtonElement;
    satellite?: HTMLButtonElement;
  }>({});
  const basemapOutsideClickHandlerRef = useRef<((event: MouseEvent) => void) | null>(null);

  useEffect(() => {
    stationsRef.current = stations;
  }, [stations]);

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  useEffect(() => {
    baseMapRef.current = baseMap;
  }, [baseMap]);

  useEffect(() => {
    onSourceChangeRef.current = onSourceChange;
  }, [onSourceChange]);

  const updateSourceControlUI = (nextSource: DataSource) => {
    if (!sourceControlContainerRef.current) return;
    const mockBtn = sourceControlButtonsRef.current.mock;
    const airBtn = sourceControlButtonsRef.current.air;
    if (!mockBtn || !airBtn) return;

    const active = "bg-emerald-600 text-white shadow";
    const inactive = "hover:bg-emerald-100 text-emerald-800";

    mockBtn.className =
      "rounded-full px-2.5 py-1 transition " +
      (nextSource === "mock" ? active : inactive);
    airBtn.className =
      "rounded-full px-2.5 py-1 transition " +
      (nextSource === "air4thai" ? active : inactive);
  };

  const refreshMarkersAndView = (map: any) => {
    const L = (window as any).L;
    if (!L) return;

    if (markersRef.current.length > 0) {
      markersRef.current.forEach((marker) => {
        try {
          map.removeLayer(marker);
        } catch {}
      });
      markersRef.current = [];
    }

    stationsRef.current.forEach((station) => {
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

    if (stationsRef.current.length > 0) {
      if (sourceRef.current === "air4thai") {
        const validLatLng = stationsRef.current
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
  };

  const updateBasemapControlUI = (nextBaseMap: BaseMap) => {
    if (!basemapControlContainerRef.current) return;
    const streetBtn = basemapButtonsRef.current.street;
    const satelliteBtn = basemapButtonsRef.current.satellite;
    if (!streetBtn || !satelliteBtn) return;

    const active = "bg-emerald-600 text-white shadow";
    const inactive = "hover:bg-emerald-100 text-emerald-800";

    satelliteBtn.className =
      "w-full rounded-md px-2.5 py-2 text-left transition " +
      (nextBaseMap === "satellite" ? active : inactive);

    streetBtn.className =
      "w-full rounded-md px-2.5 py-2 text-left transition " +
      (nextBaseMap === "street" ? active : inactive);
  };

  const applyBaseLayer = (map: any) => {
    const L = (window as any).L;
    if (!L) return;

    if (!baseLayersRef.current.street) {
      baseLayersRef.current.street = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        },
      );
    }

    if (!baseLayersRef.current.satellite) {
      baseLayersRef.current.satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution: "Tiles © Esri",
        },
      );
    }

    const nextLayer =
      baseMapRef.current === "satellite"
        ? baseLayersRef.current.satellite
        : baseLayersRef.current.street;

    if (!nextLayer) return;

    if (baseLayersRef.current.current && map.hasLayer(baseLayersRef.current.current)) {
      try {
        map.removeLayer(baseLayersRef.current.current);
      } catch {}
    }

    if (!map.hasLayer(nextLayer)) {
      nextLayer.addTo(map);
    }

    baseLayersRef.current.current = nextLayer;
  };

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

        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current);
          mapInstanceRef.current = map;

          applyBaseLayer(map);

          if (!basemapControlRef.current) {
            const BasemapControl = L.Control.extend({
              onAdd: () => {
                const container = L.DomUtil.create("div", "leaflet-control") as HTMLElement;
                container.className = "leaflet-control";
                container.style.position = "relative";

                const toggleBtn = L.DomUtil.create(
                  "button",
                  "h-10 w-10 rounded-xl bg-white/90 backdrop-blur border border-emerald-200 shadow-sm flex items-center justify-center",
                  container,
                ) as HTMLButtonElement;
                toggleBtn.type = "button";
                toggleBtn.setAttribute("aria-label", "สลับแผนที่");
                toggleBtn.innerHTML =
                  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
                  + '<path d="M12 2L3 7l9 5 9-5-9-5Z" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/>'
                  + '<path d="M3 12l9 5 9-5" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/>'
                  + '<path d="M3 17l9 5 9-5" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/>'
                  + "</svg>";

                const menu = L.DomUtil.create(
                  "div",
                  "absolute left-0 top-full mt-2 z-50 w-40 rounded-xl bg-white/95 backdrop-blur border border-emerald-200 shadow-sm p-1 hidden",
                  container,
                ) as HTMLElement;

                const streetBtn = L.DomUtil.create(
                  "button",
                  "w-full rounded-md px-2.5 py-2 text-left transition",
                  menu,
                ) as HTMLButtonElement;
                streetBtn.type = "button";
                streetBtn.textContent = "Street Map";

                const satelliteBtn = L.DomUtil.create(
                  "button",
                  "w-full rounded-md px-2.5 py-2 text-left transition",
                  menu,
                ) as HTMLButtonElement;
                satelliteBtn.type = "button";
                satelliteBtn.textContent = "ดาวเทียม";

                basemapControlContainerRef.current = container;
                basemapButtonsRef.current = {
                  toggle: toggleBtn,
                  menu,
                  street: streetBtn,
                  satellite: satelliteBtn,
                };

                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.disableScrollPropagation(container);

                const closeMenu = () => {
                  menu.classList.add("hidden");
                };

                L.DomEvent.on(toggleBtn, "click", () => {
                  menu.classList.toggle("hidden");
                });

                L.DomEvent.on(streetBtn, "click", () => {
                  setBaseMap("street");
                  closeMenu();
                });
                L.DomEvent.on(satelliteBtn, "click", () => {
                  setBaseMap("satellite");
                  closeMenu();
                });

                const outsideHandler = (event: MouseEvent) => {
                  const target = event.target as Node | null;
                  if (!target) return;
                  if (!container.contains(target)) {
                    closeMenu();
                  }
                };
                basemapOutsideClickHandlerRef.current = outsideHandler;
                document.addEventListener("click", outsideHandler);

                updateBasemapControlUI(baseMapRef.current);

                return container;
              },
              onRemove: () => {},
            });

            basemapControlRef.current = new BasemapControl({ position: "topleft" });
            basemapControlRef.current.addTo(map);
          }

          if (onSourceChangeRef.current && !sourceControlRef.current) {
            const SourceControl = L.Control.extend({
              onAdd: () => {
                const container = L.DomUtil.create(
                  "div",
                  "leaflet-control",
                ) as any as HTMLElement;
                container.className =
                  "leaflet-control rounded-xl bg-white/90 backdrop-blur border border-emerald-200 shadow-sm p-1";

                const wrap = L.DomUtil.create(
                  "div",
                  "inline-flex items-center gap-1 text-[11px] font-medium",
                  container,
                );

                const mockBtn = L.DomUtil.create(
                  "button",
                  "rounded-full px-2.5 py-1 transition",
                  wrap,
                ) as HTMLButtonElement;
                mockBtn.type = "button";
                mockBtn.textContent = "Mock";

                const airBtn = L.DomUtil.create(
                  "button",
                  "rounded-full px-2.5 py-1 transition",
                  wrap,
                ) as HTMLButtonElement;
                airBtn.type = "button";
                airBtn.textContent = "Air4Thai";

                sourceControlButtonsRef.current = { mock: mockBtn, air: airBtn };

                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.disableScrollPropagation(container);

                L.DomEvent.on(mockBtn, "click", () => {
                  onSourceChangeRef.current?.("mock");
                });
                L.DomEvent.on(airBtn, "click", () => {
                  onSourceChangeRef.current?.("air4thai");
                });

                sourceControlContainerRef.current = container;
                updateSourceControlUI(sourceRef.current);

                return container;
              },
              onRemove: () => {},
            });

            sourceControlRef.current = new SourceControl({ position: "topright" });
            sourceControlRef.current.addTo(map);
          }

          refreshMarkersAndView(map);
        } else {
          refreshMarkersAndView(mapInstanceRef.current);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        if (basemapControlRef.current) {
          try {
            mapInstanceRef.current.removeControl(basemapControlRef.current);
          } catch {}
          basemapControlRef.current = null;
          basemapControlContainerRef.current = null;
          basemapButtonsRef.current = {};

          if (basemapOutsideClickHandlerRef.current) {
            document.removeEventListener("click", basemapOutsideClickHandlerRef.current);
            basemapOutsideClickHandlerRef.current = null;
          }
        }

        if (sourceControlRef.current) {
          try {
            mapInstanceRef.current.removeControl(sourceControlRef.current);
          } catch {}
          sourceControlRef.current = null;
          sourceControlContainerRef.current = null;
          sourceControlButtonsRef.current = {};
        }

        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).L) return;
    applyBaseLayer(mapInstanceRef.current);
    updateBasemapControlUI(baseMap);
  }, [baseMap]);

  useEffect(() => {
    updateSourceControlUI(source);
    if (!mapInstanceRef.current || !(window as any).L) return;
    refreshMarkersAndView(mapInstanceRef.current);
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
