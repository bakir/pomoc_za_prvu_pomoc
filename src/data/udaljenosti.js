export const UDALJENOSTI_QUIZ_IDS = [
  '66',
  '83',
  '90',
  '91',
  '101',
  '103',
  '113',
  '159',
  '195',
  '297',
  '329',
  '334',
  '349',
  '374',
];

export const UDALJENOSTI_SECTIONS = [
  {
    id: 'zabrana-parkiranje',
    title: '1. Zabranjeno zaustavljanje i parkiranje (Udaljenosti od objekata)',
    items: [
      {
        distance: 'Manje od 5 m',
        text: 'Vozač ne smije da zaustavi ili parkira vozilo na raskrsnici i na razdaljini od najbliže ivice poprečnog kolovoza manjoj od 5 metara.',
        questionIds: ['91'],
      },
      {
        distance: 'Manje od 5 m',
        text: 'Vozač ne smije da zaustavi ili parkira vozilo na obilježenom pješačkom prelazu i na razdaljini manjoj od 5 metara od tog prelaza.',
        questionIds: ['101'],
      },
      {
        distance: 'Rastojanje od 15 m (Stajališta)',
        text: 'Vozač ne smije da parkira vozilo na razdaljini manjoj od 15 metara ispred i iza znaka kojim je obilježeno stajalište za vozila javnog saobraćaja.',
        questionIds: ['66'],
      },
    ],
  },
  {
    id: 'pjesaci',
    title: '2. Pješaci i pješački prelazi',
    items: [
      {
        distance: 'Do 100 m udaljenosti',
        text: 'Pješak je dužan da se kreće obilježenim pješačkim prelazom ili posebno izgrađenim prelazom/prolazom ako oni nisu od njega udaljeni više od 100 metara.',
        questionIds: ['83', '329'],
      },
    ],
  },
  {
    id: 'trokut',
    title: '3. Bezbjednosni trokut i označavanje vozila u slučaju kvara',
    items: [
      {
        distance: 'Najmanje 10 m (U naselju)',
        text: 'Ako je vozač prinuđen da zaustavi/parkira vozilo na pješačkom ili blizu njega u naselju, sigurnosni trokut se postavlja na udaljenosti koja ne smije biti manja od 10 metara iza vozila.',
        questionIds: ['103'],
      },
      {
        distance: 'Najmanje 50 m (Van naselja)',
        text: 'Na putu van naselja, u slučaju zaustavljanja zbog neispravnosti, bezbjednosni trokut se mora postaviti u vertikalnom položaju na udaljenosti od minimalno 50 metara iza vozila.',
        questionIds: ['195'],
      },
    ],
  },
  {
    id: 'zeljeznicka',
    title: '4. Prelazi preko željezničke pruge i infrastruktura',
    items: [
      {
        distance: 'Od 3 m do 10 m',
        text: 'Znak "Andrejin krst" postavlja se na udaljenosti koja ne može biti manja od 3 metra niti veća od 10 metara od najbliže šine.',
        questionIds: ['113'],
      },
      {
        distance: 'Najmanje 50 m (Uočljivost znaka)',
        text: 'Znak "Andrejin krst" mora biti uočljiv sa udaljenosti od najmanje 50 metara.',
        questionIds: ['374'],
      },
    ],
  },
  {
    id: 'odstojanje-vozila',
    title: '5. Međusobno odstojanje vozila u kretanju',
    items: [
      {
        distance: 'Od 3 m do 5 m (Uže za vuču)',
        text: 'Odstojanje između vučnog i vučenog motornog vozila, ako se vuče pomoću užeta, mora iznositi od 3 do 5 metara.',
        questionIds: ['90'],
      },
      {
        distance: 'Najmanje 50 m (Zaprežna vozila)',
        text: 'Zaprežna vozila koja se kreću jedno iza drugog moraju držati međusobno odstojanje od najmanje 50 metara.',
        questionIds: ['349'],
      },
    ],
  },
  {
    id: 'zastitni-pojas',
    title: '6. Zaštitni pojas puta i oglašavanje (Van naselja)',
    items: [
      {
        distance: 'Najmanje 3 m',
        text: 'Javni put izvan naselja čini i zemljišni pojas s obje strane puta širine najmanje 3 metra, računajući od krajnje tačke poprečnog profila puta.',
        questionIds: ['159'],
      },
      {
        distance: 'Najmanje 10 m (Reklame)',
        text: 'U zaštitnom pojasu javnog puta van naselja, natpisi za reklame se pored magistralnog i regionalnog puta mogu postavljati na razdaljini od najmanje 10 metara.',
        questionIds: ['297'],
      },
      {
        distance: 'Najmanje 12 m (Reklame na autoputu)',
        text: 'U zaštitnom pojasu javnog puta van naselja, natpisi za reklame se pored autoputa i puta rezervisanog za saobraćaj motornih vozila mogu postavljati na razdaljini od najmanje 12 metara.',
        questionIds: ['334'],
      },
    ],
  },
];
