export const BITNE_BRZINE_QUIZ_IDS = [
  '10',
  '23',
  '100',
  '119',
  '132',
  '141',
  '145',
  '162',
  '164',
  '181',
  '184',
  '188',
];

export const BITNE_BRZINE_SECTIONS = [
  {
    id: 'pocetnici',
    title: '1. Vozači početnici (Prve 2 godine od sticanja B kategorije)',
    items: [
      {
        speed: '90 km/h',
        text: 'Maksimalna dozvoljena brzina na brzom putu za vozače početnike.',
        questionIds: ['132'],
      },
      {
        speed: '100 km/h',
        text: 'Maksimalna dozvoljena brzina na putevima rezervisanim za saobraćaj motornih vozila za vozače početnike.',
        questionIds: ['132'],
      },
      {
        speed: '120 km/h',
        text: 'Maksimalna dozvoljena brzina na autoputu za vozače početnike.',
        questionIds: ['132'],
      },
    ],
  },
  {
    id: 'vozila',
    title: '2. Specifična vozila i prikolice (B kategorija)',
    items: [
      {
        speed: '30 km/h',
        text: 'Najveća dozvoljena brzina za traktore koji vuku priključno vozilo.',
        questionIds: ['10'],
      },
      {
        speed: '40 km/h',
        text: 'Maksimalna brzina motornog vozila koje na putu vuče drugo neispravno motorno vozilo.',
        questionIds: ['145'],
      },
      {
        speed: '80 km/h',
        text: 'Maksimalna brzina za motorna vozila koja vuku prikolicu za stanovanje (kamp-prikolicu) ili laku prikolicu.',
        questionIds: ['184'],
      },
    ],
  },
  {
    id: 'put-lokacija',
    title: '3. Pravila prema tipu puta i lokaciji (B kategorija)',
    items: [
      {
        speed: '50 km/h',
        text: 'Standardno, opšte ograničenje brzine na putevima u naselju, osim ako znakom nije drugačije određeno.',
        questionIds: ['119', '164', '181'],
      },
      {
        speed: '80 km/h',
        text: 'Standardno ograničenje na javnim putevima van naselja (izuzev autoputa, brzog puta i puta rezervisanog za motorna vozila).',
        questionIds: ['188'],
      },
      {
        speed: '40 km/h (minimalna)',
        text: 'Autoputem ne smiju da se kreću motorna vozila koja prema svojim konstrukcionim osobinama ne mogu da se kreću brzinom većom od 40 km/h.',
        questionIds: ['23', '100'],
      },
      {
        speed: '130 km/h (maksimalna)',
        text: 'Na autoputu vozač ne smije da upravlja vozilom koje se kreće brzinom većom od 130 km/h (osim ako je znakom drugačije određeno).',
        questionIds: ['162'],
      },
    ],
  },
  {
    id: 'tehnicka',
    title: '4. Ostala tehnička pravila kretanja',
    items: [
      {
        speed: '20 km/h',
        text: 'Vozač ne smije smanjiti brzinu kretanja vozila do te mjere da njegovo vozilo pričinjava smetnju normalnom odvijanju saobraćaja (ispod ove brzine).',
        questionIds: ['141'],
      },
    ],
  },
];
