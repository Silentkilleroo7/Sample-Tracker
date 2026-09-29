export interface FabricAwbShipment {
  id: string;
  awbNumber: string; // Supplier provided AWB number (e.g. "DHL-77482910")
  supplier: string;
  courier?: string; // e.g. "DHL Express", "FedEx", "UPS", "SF Express"
  expectedYards: number; // Exact yardage amount against this AWB number
  informedAt: string; // ISO timestamp when shortage was informed & AWB inserted
  expectedArrivalDate?: string; // YYYY-MM-DD
  status: 'in_transit' | 'arrived';
  arrivedAt?: string; // ISO timestamp when user confirmed AWB arrival & yds were auto-added
  receivedBy?: string;
  notes?: string;
}

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
  perPcsConsumptionYards?: number; // saved per-piece fabric consumption in yds (set on 1st requisition)
  styleConsumptionMap?: Record<string, number>;
  minimumThresholdYards: number; // default is 5
  supplier: string;
  location: string;
  lastReceivedDate: string;
  pendingAwbNumber?: string;
  pendingAwbYards?: number;
  awbShipments?: FabricAwbShipment[];
}

export function isFabricLowStock(fabric: FabricItem): boolean {
  return fabric.availableYards <= (fabric.minimumThresholdYards || 5);
}

export function getPendingAwbShipments(fabric: FabricItem): FabricAwbShipment[] {
  const list = Array.isArray(fabric.awbShipments) ? fabric.awbShipments : [];
  const inTransit = list.filter((s) => s && s.status === 'in_transit' && s.awbNumber);
  if (inTransit.length > 0) return inTransit;

  // Fallback if only pendingAwbNumber & pendingAwbYards are set
  if (fabric.pendingAwbNumber && fabric.pendingAwbNumber.trim() && (fabric.pendingAwbYards || 0) > 0) {
    return [
      {
        id: `awb-legacy-${fabric.id}`,
        awbNumber: fabric.pendingAwbNumber.trim(),
        supplier: fabric.supplier || 'Mill Supplier',
        courier: 'Air Courier',
        expectedYards: Number(fabric.pendingAwbYards),
        informedAt: new Date().toISOString(),
        status: 'in_transit',
      },
    ];
  }
  return [];
}

export function getArrivedAwbShipments(fabric: FabricItem): FabricAwbShipment[] {
  const list = Array.isArray(fabric.awbShipments) ? fabric.awbShipments : [];
  return list.filter((s) => s && s.status === 'arrived' && s.awbNumber);
}

export function getTotalPendingAwbYards(fabric: FabricItem): number {
  return Number(
    getPendingAwbShipments(fabric)
      .reduce((sum, s) => sum + Math.max(0, Number(s.expectedYards) || 0), 0)
      .toFixed(2)
  );
}
