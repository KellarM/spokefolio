// Built-in library of instant point-form career details keyed by equipment, role, or skill.
export const CAREER_DETAIL_LIBRARY = [
  {
    id: 'fork-truck',
    label: 'Fork Truck / Forklift',
    suggestedTitle: 'Fork Truck & Material Handling Operator',
    keywords: ['fork truck', 'forklift', 'lift truck', 'powered industrial truck', 'tow motor', 'hi-lo', 'material handler', 'clamp truck', 'reach truck'],
    items: [
      { text: 'Certification License', category: 'certification' },
      { text: 'Clamp Truck', category: 'equipment' },
      { text: 'Unloading / Loading', category: 'duty' },
      { text: 'Daily Maintenance Activity Log', category: 'compliance' },
      { text: 'Pre-Shift Safety & Circle Check Inspection', category: 'compliance' },
      { text: 'Propane, Electric & Sit-Down Counterbalance', category: 'equipment' },
      { text: 'Reach Truck & Narrow-Aisle Order Picker', category: 'equipment' },
      { text: 'Trailer Chocking, Dock Lock & Dock Plate Safety', category: 'compliance' },
      { text: 'Pallet Stacking, Shrink-Wrapping & Staging', category: 'duty' },
      { text: 'High-Rack Put-Away & Inventory Replenishment', category: 'duty' },
      { text: 'RF Barcode Scanner & WMS Tracking', category: 'equipment' },
      { text: 'Load Weight Distribution & Capacity Compliance', category: 'compliance' },
      { text: 'Operated counterbalance, reach, and clamp trucks to load and unload trailers safely and on schedule.', category: 'accomplishment' },
      { text: 'Completed daily maintenance activity logs and pre-shift safety inspections with zero lost-time incidents.', category: 'accomplishment' }
    ]
  },
  {
    id: 'warehouse-supervisor',
    label: 'Warehouse Supervision',
    suggestedTitle: 'Warehouse Supervisor',
    keywords: ['warehouse', 'supervisor', 'warehouse supervisor', 'distribution', 'plant', 'lean', 'operations', 'shift lead', 'foreman'],
    items: [
      { text: 'Shift Scheduling & Crew Dispatch', category: 'duty' },
      { text: 'Daily Tailgate & Safety Toolbox Talks', category: 'compliance' },
      { text: 'Lean 5S & Floor Organization', category: 'compliance' },
      { text: 'Receiving, Put-Away & Outbound Shipping', category: 'duty' },
      { text: 'Cycle Counting & Inventory Accuracy', category: 'duty' },
      { text: 'WMS / ERP Inventory Systems', category: 'equipment' },
      { text: 'Carrier & Dock Door Coordination', category: 'duty' },
      { text: 'WHMIS, OSHA & Joint Health & Safety', category: 'certification' },
      { text: 'KPI Tracking (Pick Rate, On-Time Shipments)', category: 'compliance' },
      { text: 'Onboarding & Cross-Training Floor Staff', category: 'duty' },
      { text: 'Directed daily floor operations, shift handoffs, and dock scheduling to meet on-time shipping targets.', category: 'accomplishment' },
      { text: 'Enforced safety inspections, daily maintenance logs, and 5S standards across warehouse zones.', category: 'accomplishment' }
    ]
  },
  {
    id: 'shipping-receiving',
    label: 'Shipping & Receiving',
    suggestedTitle: 'Shipping & Receiving Specialist',
    keywords: ['shipping', 'receiving', 'shipper', 'receiver', 'dock', 'freight', 'bill of lading', 'bol', 'manifest', 'logistics'],
    items: [
      { text: 'Bill of Lading (BOL) & Packing Slip Verification', category: 'compliance' },
      { text: 'Unloading / Loading Commercial Trailers', category: 'duty' },
      { text: 'Freight Damage & Discrepancy Reporting', category: 'compliance' },
      { text: 'LTL & FTL Carrier Scheduling', category: 'duty' },
      { text: 'Pallet Jack, Walkie Stacker & Fork Truck', category: 'equipment' },
      { text: 'Customs &Dangerous Goods (TDG) Documentation', category: 'certification' },
      { text: 'Order Pulling, Staging & Stretch-Wrapping', category: 'duty' },
      { text: 'Inbound Stock Put-Away & Bin Labeling', category: 'duty' },
      { text: 'Verified inbound and outbound freight against bills of lading, resolving count discrepancies before dispatch.', category: 'accomplishment' }
    ]
  },
  {
    id: 'inventory-control',
    label: 'Inventory & Stock Control',
    suggestedTitle: 'Inventory Control Specialist',
    keywords: ['inventory', 'stock', 'cycle count', 'wms', 'sap', 'erp', 'supply chain', 'parts', 'material control'],
    items: [
      { text: 'Daily Cycle Counts & Full Physical Audits', category: 'duty' },
      { text: 'FIFO / FEFO Lot & Expiry Rotation', category: 'compliance' },
      { text: 'SAP / Oracle / WMS System Reconciliation', category: 'equipment' },
      { text: 'Root-Cause Shrinkage & Variance Investigation', category: 'compliance' },
      { text: 'Min/Max Reorder Point Monitoring', category: 'duty' },
      { text: 'RF Barcode & SKU Slotting Optimization', category: 'equipment' },
      { text: 'Cold Storage & Temperature Log Monitoring', category: 'compliance' },
      { text: 'Maintained high inventory accuracy through systematic cycle counting, FIFO rotation, and variance reconciliation.', category: 'accomplishment' }
    ]
  },
  {
    id: 'safety-compliance',
    label: 'Safety & Maintenance',
    suggestedTitle: 'Safety & Maintenance Coordinator',
    keywords: ['safety', 'maintenance', 'whmis', 'first aid', 'lockout', 'loto', 'inspection', 'osha', 'ohs'],
    items: [
      { text: 'Daily Maintenance Activity Log', category: 'compliance' },
      { text: 'Lockout / Tagout (LOTO) Procedures', category: 'certification' },
      { text: 'WHMIS & TDG Certification', category: 'certification' },
      { text: 'Standard First Aid & CPR Level C', category: 'certification' },
      { text: 'Preventive Equipment Maintenance Checks', category: 'duty' },
      { text: 'Hazard Identification & Near-Miss Reporting', category: 'compliance' },
      { text: 'PPE Compliance & Floor Safety Audits', category: 'compliance' },
      { text: 'Incident Investigation & Corrective Action Logs', category: 'compliance' }
    ]
  },
  {
    id: 'customer-service',
    label: 'Customer Service & Sales',
    suggestedTitle: 'Customer Service Representative',
    keywords: ['customer service', 'client', 'retail', 'sales', 'cashier', 'pos', 'front desk', 'support', 'call center'],
    items: [
      { text: 'POS Terminal, Cash & Card Reconciliation', category: 'equipment' },
      { text: 'Order Intake, Quotes & Account Lookup', category: 'duty' },
      { text: 'Issue De-escalation & Service Recovery', category: 'duty' },
      { text: 'CRM Ticketing & Follow-Up Logs', category: 'compliance' },
      { text: 'Product Recommendations & Upselling', category: 'duty' },
      { text: 'Returns, Exchanges & Warranty Processing', category: 'duty' },
      { text: 'Resolved customer inquiries and order issues promptly while maintaining high satisfaction and repeat business.', category: 'accomplishment' }
    ]
  }
];

export const QUICK_TOPICS = CAREER_DETAIL_LIBRARY.map((group) => ({
  id: group.id,
  label: group.label,
  query: group.label.split('/')[0].trim()
}));

export function matchBuiltInDetails(rawQuery) {
  const q = String(rawQuery || '').trim().toLowerCase();
  if (!q) return { matchedTitle: '', items: [] };

  const words = q.split(/\s+/).filter((w) => w.length >= 2);
  let bestGroup = null;
  let bestScore = 0;

  for (const group of CAREER_DETAIL_LIBRARY) {
    let score = 0;
    for (const kw of group.keywords) {
      if (q.includes(kw) || kw.includes(q)) score += 6;
      for (const word of words) {
        if (kw.includes(word)) score += 2;
      }
    }
    for (const item of group.items) {
      const textLower = item.text.toLowerCase();
      if (textLower.includes(q)) score += 3;
      for (const word of words) {
        if (textLower.includes(word)) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestGroup = group;
    }
  }

  if (!bestGroup || bestScore < 2) {
    return { matchedTitle: '', items: [] };
  }

  return {
    matchedTitle: bestGroup.suggestedTitle,
    items: bestGroup.items.map((item, idx) => ({
      id: `builtin-${bestGroup.id}-${idx}`,
      text: item.text,
      category: item.category,
      source: 'builtin'
    }))
  };
}