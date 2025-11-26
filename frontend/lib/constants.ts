// Hardcoded fields that are always extracted from waste bills
export const HARDCODED_FIELDS = [
  { name: 'start date', description: 'Start date of reporting period', type: 'string' },
  { name: 'end date', description: 'End date of reporting period', type: 'string' },
  { name: 'total', description: 'Total volume', type: 'number' },
];

export const HARDCODED_FIELD_NAMES = ['start date', 'end date', 'total'] as const;

// Default waste stream fields
export const DEFAULT_STREAM_FIELDS = [
  { name: 'recycle', description: 'Total volume of all recycling streams', type: 'number' },
  { name: 'compost', description: 'Total volume of all compost streams', type: 'number' },
  { name: 'trash', description: 'Total volume of all trash streams', type: 'number' },
];
