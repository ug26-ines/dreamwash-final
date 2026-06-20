export const RATES = {
  walkin:     { full: 1500, wdonly: 1200, iron: 600, express: 2000, exwd: 1700 },
  club_over:  { full: 1300, wdonly: 1200, iron: 600, express: 2000, exwd: 1700 },
  b2b:        { full: 1500, wdonly: 1200, iron: 600, express: 2000, exwd: 1700 },
  dispatcher: { full: 1500, wdonly: 1200, iron: 600, express: 2000, exwd: 1700 },
};

export const SERVICE_NAMES = {
  full:    'Full Wash',
  wdonly:  'Wash & Dry',
  iron:    'Iron Only',
  express: 'Express Full',
  exwd:    'Express Wash & Dry',
};

export const CLIENT_TYPES = {
  walkin:     'Walk-in',
  club:       '10k Club',
  b2b:        'B2B',
  dispatcher: 'Dispatcher',
};

export const ADDONS = [
  { key: 'duvet',    name: 'Duvet / Blanket',   price: 5000 },
  { key: 'suit',     name: '2-Piece Suit',       price: 3000 },
  { key: 'coat',     name: 'Heavy Coat',         price: 2500 },
  { key: 'military', name: 'Military Uniform',   price: 3000 },
  { key: 'curtains', name: 'Curtains (pair)',    price: 2000 },
  { key: 'overalls', name: 'Mechanic Overalls',  price: 1000 },
];
