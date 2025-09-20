const AYURVEDIC_HERBS = [
  { id: 1, botanical: 'Abies webbiana Lindl', common: 'Talispatra' },
  { id: 2, botanical: 'Abrus precatorius Linn.', common: 'Chirmati, Chinnoti' },
  { id: 3, botanical: 'Acacia catechu (L.f.) Willd', common: 'Katha' },
  { id: 4, botanical: 'Aconitum chasmanthum Stapf', common: 'Vatsnabh(API)' },
  { id: 5, botanical: 'Aconitum ferox Wall./A. balfouri', common: 'Vatsnabh' },
  { id: 6, botanical: 'Aconitum heterophyllum Wall. ex Royle', common: 'Atees' },
  { id: 7, botanical: 'Acorus calamus Linn.', common: 'Vach' },
  { id: 8, botanical: 'Adhatoda zeylanica Medic.', common: 'Adusa' },
  { id: 9, botanical: 'Aegle marmelos (Linn) Corr.', common: 'Beal' },
  { id: 10, botanical: 'Albizzia lebback Benth.', common: 'Shirish' },
  { id: 11, botanical: 'Aloe vera (Linn.) Burn.', common: 'Ghritkumari' },
  { id: 12, botanical: 'Alpinia calcarata Rosc.', common: 'Smaller Galanga' },
  { id: 13, botanical: 'Alpinia galangal Willd', common: 'Greater Galanga' },
  { id: 14, botanical: 'Alstonia scholaris R.Br.', common: 'Satvin, Saptaparna' },
  { id: 15, botanical: 'Altingia excelsa Noronha', common: 'Silarasa' },
  { id: 16, botanical: 'Anacyclus pyrethrum DC.', common: 'Akarkara' },
  { id: 17, botanical: 'Andrographis paniculata (Linn.) Burn', common: 'Kalmegh' },
  { id: 18, botanical: 'Aquilaria agallocha Roxb.', common: 'Agar' },
  { id: 19, botanical: 'Artemisia annua (Linn.)', common: 'Artemisia' },
  { id: 20, botanical: 'Asparagus racemosus Willd.', common: 'Shatavari' },
  { id: 21, botanical: 'Atropa belledona Linn', common: 'Atropa' },
  { id: 22, botanical: 'Azadirachta indica A. Juss', common: 'Neem' },
  { id: 23, botanical: 'Bacopa monnieri (L.) Pennell', common: 'Brahmi' },
  { id: 24, botanical: 'Berberis aristata DC.', common: 'Daruhaldi' },
  { id: 25, botanical: 'Bergenia ciliata Stern.', common: 'Pashnabheda' },
  { id: 26, botanical: 'Boerhaavia diffusa Linn.', common: 'Punarnava' },
  { id: 27, botanical: 'Caesalpinia sappan Linn.', common: 'Patang' },
  { id: 28, botanical: 'Cassia angustifolia Vahl.', common: 'Senna' },
  { id: 29, botanical: 'Catharanthus roseus (L.) G.Don)', common: 'Sadabahar' },
  { id: 30, botanical: 'Celastrus paniculatus Willd.', common: 'Malkangani, Jyothismathi' }
];

const PROCESSING_METHODS = [
  'Steam Distillation',
  'Solvent Extraction',
  'Cold Pressing',
  'Supercritical CO2 Extraction',
  'Hydro Distillation',
  'Enfleurage',
  'Maceration',
  'Traditional Drying',
  'Freeze Drying',
  'Fermentation'
];

const APPROVED_ZONES = [
  'Himalayan Region - Uttarakhand',
  'Western Ghats - Kerala',
  'Eastern Ghats - Tamil Nadu',
  'Central India - Madhya Pradesh',
  'Northeast - Assam',
  'Rajasthan Desert Region',
  'Nilgiri Hills - Tamil Nadu',
  'Aravalli Range - Rajasthan',
  'Sahyadri Range - Maharashtra',
  'Vindhya Range - Madhya Pradesh'
];

const ROLES = {
  COLLECTOR: 1,
  TESTER: 2,
  PROCESSOR: 3,
  MANUFACTURER: 4,
  ADMIN: 5
};

const API_KEYS = {
  FAST2SMS: '8f953041e0edf946867d6984c1a55d13-2b9a0b70-41a0-417f-a986-a26456fa0437',
  PINATA_API: '0d0ed881d5c92ef85ab5',
  PINATA_SECRET: '50f8fd520edd4e982d87157703c98d7f32c899b3e3d48767bb2275826f2b7f90',
  OPENCELLID: 'pk.488d8abef0b49804a3e6bdfdb4320703'
};

module.exports = {
  AYURVEDIC_HERBS,
  PROCESSING_METHODS,
  APPROVED_ZONES,
  ROLES,
  API_KEYS
};