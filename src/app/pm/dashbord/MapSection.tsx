import { getThailandStations } from "../_lib/air4thai";
import MapClient from "./MapClient";

type MapSource = "mock" | "air4thai";

type MapStation = {
  name: string;
  pm25: number;
  level: string;
  lat: number;
  lng: number;
  status?: string;
  lastUpdate?: string | null;
};

type MapSectionProps = {
  requestedSource: MapSource;
  fallbackStations: MapStation[];
};

export default async function MapSection({
  requestedSource,
  fallbackStations,
}: MapSectionProps) {
  if (requestedSource !== "air4thai") {
    return <MapClient source="mock" stations={fallbackStations} />;
  }

  let mapped: MapStation[] = [];
  let ok = false;
  try {
    const rawStations = await getThailandStations();

    mapped = rawStations
      .map((s) => {
        if (s.lat == null || s.lng == null || s.pm25 == null) return null;

        const name: string =
          typeof s.areaTH === "string"
            ? s.areaTH
            : typeof s.nameTH === "string"
              ? s.nameTH
              : "ไม่ทราบชื่อสถานี";

        const level: string = typeof s.level === "string" ? s.level : "ปานกลาง";

        const station: MapStation = {
          name,
          pm25: s.pm25,
          level,
          lat: s.lat,
          lng: s.lng,
          status: "ออนไลน์",
          lastUpdate: s.lastUpdate,
        };

        return station;
      })
      .filter((s): s is MapStation => s !== null);

    ok = mapped.length > 0;
  } catch {
    ok = false;
  }

  if (!ok) {
    return <MapClient source="mock" stations={fallbackStations} loading={false} />;
  }

  return <MapClient source="air4thai" stations={mapped} loading={false} />;
}
