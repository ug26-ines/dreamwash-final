export const PIPELINE_STAGES = [
  { key: 'received',  label: 'Received',  description: 'Clothes received at Dream X Wash' },
  { key: 'washing',   label: 'Washing',   description: 'In the washing machine now' },
  { key: 'drying',    label: 'Drying',    description: 'Drying in progress' },
  { key: 'pressing',  label: 'Pressing',  description: 'Being pressed and folded' },
  { key: 'ready',     label: 'Ready',     description: 'Ready for collection or delivery' },
  { key: 'collected', label: 'Collected', description: 'Picked up — done!' },
];

export const STAGE_ORDER = PIPELINE_STAGES.map(s => s.key);
