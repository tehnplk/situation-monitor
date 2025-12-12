import { getThailandStations } from "../_lib/air4thai";
import ThailandLeafletMapClient from "./ThailandLeafletMapClient";

type MapStation = {
  name: string;
  province: string | null;
  pm25: number;
  level: string;
  lat: number;
  lng: number;
};

export default async function StationsMapSection() {
  let mapped: MapStation[] = [];
  let ok = false;
  try {
    const rawStations = await getThailandStations();

    mapped = rawStations
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

    ok = true;
  } catch {
    ok = false;
  }

  if (!ok) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
        ไม่สามารถโหลดข้อมูลจาก Air4Thai (ทั้งประเทศ) ได้
      </div>
    );
  }

  return <ThailandLeafletMapClient stations={mapped} />;
}
