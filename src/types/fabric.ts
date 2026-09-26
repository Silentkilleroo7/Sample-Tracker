export interface FabricItem {
  id: string;
  code: string; // e.g. "FAB-DNM-04"
  name: string; // e.g. "12.5oz Slub Indigo Denim"
  linkedStyleCodes: string[]; // e.g. ["ST-8820", "ST-8821"]
  composition: string; // e.g. "98% Cotton 2% Spandex"
  color: string;
  gsm: number;
  widthInches: number;
  availableYards: number;
  allocatedYards: number;
  minimumThresholdYards: number; // default is 5
  supplier: string;
  location: string;
  lastReceivedDate: string;
}

export function isFabricLowStock(fabric: FabricItem): boolean {
  return fabric.availableYards <= (fabric.minimumThresholdYards || 5);
}
