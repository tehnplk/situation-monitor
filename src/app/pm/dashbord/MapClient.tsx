"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LeafletMap from "./LeafletMap";

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

type MapClientProps = {
  source: MapSource;
  stations: MapStation[];
  loading?: boolean;
};

export default function MapClient({ source, stations, loading }: MapClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSourceChange = (nextSource: MapSource) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("source", nextSource);
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <LeafletMap
      stations={stations}
      source={source}
      onSourceChange={handleSourceChange}
      loading={loading}
    />
  );
}
