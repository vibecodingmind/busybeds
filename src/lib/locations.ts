export const COUNTRIES = [
  'Tanzania', 'Kenya', 'Uganda', 'Rwanda', 'Burundi',
  'Ethiopia', 'Mozambique', 'Zambia', 'Malawi', 'Zimbabwe',
  'South Africa', 'Nigeria', 'Ghana', 'Senegal', 'Ivory Coast',
  'Cameroon', 'Egypt', 'Morocco', 'Tunisia', 'Algeria',
  'Other',
];

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Tanzania: [
    'Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza', 'Zanzibar City',
    'Mbeya', 'Morogoro', 'Tanga', 'Kigoma', 'Sumbawanga',
    'Musoma', 'Tabora', 'Shinyanga', 'Moshi', 'Iringa',
    'Songea', 'Njombe', 'Lindi', 'Mtwara', 'Geita',
    'Simiyu', 'Katavi', 'Kagera', 'Ruvuma', 'Manyara',
    'Kilimanjaro', 'Pwani', 'Rukwa', 'Singida', 'Unguja',
  ],
  Kenya: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Malindi', 'Lamu'],
  Uganda: ['Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu'],
  Rwanda: ['Kigali', 'Butare', 'Gisenyi', 'Ruhengeri'],
  Ethiopia: ['Addis Ababa', 'Dire Dawa', 'Gondar', 'Lalibela', 'Axum'],
  'South Africa': ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth'],
  Nigeria: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt'],
  Egypt: ['Cairo', 'Alexandria', 'Luxor', 'Aswan', 'Sharm el-Sheikh'],
  Morocco: ['Casablanca', 'Marrakech', 'Fes', 'Rabat', 'Tangier'],
};

export function getCities(country: string): string[] {
  return CITIES_BY_COUNTRY[country] || [];
}
