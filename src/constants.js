export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

export const MEDELLIN_COORDS = { lat: 6.2442, lng: -75.5812 };

export const MOCK_PICKUPS = [
  { id: 1, lat: 6.2518, lng: -75.5636, material: 'Cartón', status: 'pending', user: 'Carlos', address: 'Comuna 10 (La Candelaria)' },
  { id: 2, lat: 6.2408, lng: -75.5898, material: 'Plástico', status: 'pending', user: 'Marta', address: 'Comuna 11 (Laureles)' },
  { id: 3, lat: 6.2104, lng: -75.5711, material: 'Vidrio', status: 'pending', user: 'Juan', address: 'Comuna 14 (El Poblado)' },
];
