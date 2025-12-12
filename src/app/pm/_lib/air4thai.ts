export type Air4ThaiStation = {
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

const AIR4THAI_ENDPOINT = "http://air4thai.pcd.go.th/services/getNewAQI_JSON.php";

function levelFromPm25(value: number): string {
  if (value <= 25) return "ดี";
  if (value <= 50) return "ปานกลาง";
  if (value <= 75) return "เริ่มมีผลกระทบ";
  return "มีผลกระทบต่อสุขภาพ";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getStationsArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const rec = getRecord(raw);
  if (!rec) return [];

  const stations = rec["stations"];
  if (Array.isArray(stations)) return stations;

  const data = rec["data"];
  if (Array.isArray(data)) return data;

  return [];
}

function normalizeStations(raw: unknown): Air4ThaiStation[] {
  const rawStations = getStationsArray(raw);

  return rawStations
    .map((s) => {
      const sRec = getRecord(s);
      if (!sRec) return null;

      const aqiLast = getRecord(sRec["AQILast"]);
      const pm25Rec = aqiLast ? getRecord(aqiLast["PM25"]) : null;
      const pmValue = pm25Rec ? getString(pm25Rec["value"]) : null;
      const pmRaw = pmValue ? parseFloat(pmValue) : NaN;
      const pm25 = Number.isFinite(pmRaw) && pmRaw >= 0 ? pmRaw : null;

      const latRaw = getString(sRec["lat"]);
      const lngRaw = getString(sRec["long"]);
      const lat = latRaw ? parseFloat(latRaw) : NaN;
      const lng = lngRaw ? parseFloat(lngRaw) : NaN;

      const areaTH = getString(sRec["areaTH"]);

      let provinceTH: string | null = null;
      if (areaTH) {
        const parts = areaTH.split(",");
        provinceTH = parts[parts.length - 1]?.trim() || null;
      }

      const stationID = sRec["stationID"];
      const nameTH = sRec["nameTH"];
      const date = aqiLast ? aqiLast["date"] : null;
      const time = aqiLast ? aqiLast["time"] : null;

      const lastUpdate =
        typeof date === "string" && typeof time === "string" ? `${date} ${time}` : null;

      const normalized: Air4ThaiStation = {
        stationID: typeof stationID === "string" ? stationID : null,
        nameTH: typeof nameTH === "string" ? nameTH : null,
        areaTH,
        provinceTH,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        pm25,
        level: pm25 == null ? null : levelFromPm25(pm25),
        status: "ออนไลน์",
        lastUpdate,
      };

      return normalized;
    })
    .filter((s): s is Air4ThaiStation =>
      Boolean(s && s.lat != null && s.lng != null && s.pm25 != null),
    );
}

export async function getThailandStations(): Promise<Air4ThaiStation[]> {
  const res = await fetch(AIR4THAI_ENDPOINT, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch data from Air4Thai");
  }

  const raw = (await res.json()) as unknown;
  return normalizeStations(raw);
}

export async function getPhitsanulokStations(): Promise<Air4ThaiStation[]> {
  const stations = await getThailandStations();
  return stations.filter(
    (s) => typeof s.areaTH === "string" && s.areaTH.includes("พิษณุโลก"),
  );
}
