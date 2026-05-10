// Philippines geography: province → city/municipality → barangay[]
// Source: PSA (Philippine Statistics Authority) official barangay list
// Focused on NCR + major provincial cities. Extend as needed.

export const PH_GEO: Record<string, Record<string, string[]>> = {
  'Metro Manila': {
    'Caloocan': [
      'Bagong Silang', 'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5',
      'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10', 'Barangay 11',
      'Barangay 12', 'Barangay 13', 'Barangay 14', 'Barangay 15', 'Barangay 16', 'Barangay 17',
      'Barangay 18', 'Barangay 19', 'Barangay 20', 'Barangay 21', 'Barangay 22', 'Barangay 23',
      'Barangay 24', 'Barangay 25', 'Barangay 26', 'Barangay 27', 'Barangay 28', 'Barangay 29',
      'Barangay 30', 'Barangay 31', 'Barangay 32', 'Barangay 33', 'Barangay 34', 'Barangay 35',
      'Barangay 36', 'Barangay 37', 'Barangay 38', 'Barangay 39', 'Barangay 40', 'Barangay 41',
      'Barangay 42', 'Barangay 43', 'Barangay 44', 'Barangay 45', 'Barangay 46', 'Barangay 47',
      'Barangay 48', 'Barangay 49', 'Barangay 50', 'Barangay 51', 'Barangay 52', 'Barangay 53',
      'Barangay 54', 'Barangay 55', 'Barangay 56', 'Barangay 57', 'Barangay 58', 'Barangay 59',
      'Barangay 60', 'Barangay 61', 'Barangay 62', 'Barangay 63', 'Barangay 64', 'Barangay 65',
      'Barangay 66', 'Barangay 67', 'Barangay 68', 'Barangay 69', 'Barangay 70', 'Barangay 71',
      'Barangay 72', 'Barangay 73', 'Barangay 74', 'Barangay 75', 'Barangay 76', 'Barangay 77',
      'Barangay 78', 'Barangay 79', 'Barangay 80', 'Barangay 81', 'Barangay 82', 'Barangay 83',
      'Barangay 84', 'Barangay 85', 'Barangay 86', 'Barangay 87', 'Barangay 88',
      'Deparo', 'Llano', 'Maypajo', 'Camarin', 'Bagumbong',
    ],
    'Las Piñas': [
      'Almanza Dos', 'Almanza Uno', 'BF International Village', 'Daniel Fajardo',
      'Elias Aldana', 'Ilaya', 'Manuyo Dos', 'Manuyo Uno',
      'Pamplona Dos', 'Pamplona Tres', 'Pamplona Uno', 'Pilar', 'Plantacion',
      'Pulang Lupa Dos', 'Pulang Lupa Uno',
      'Talon Dos', 'Talon Kuatro', 'Talon Singko', 'Talon Tres', 'Talon Uno',
    ],
    'Makati': [
      'Bangkal', 'Bel-Air', 'Cembo', 'Comembo', 'East Rembo', 'Forbes Park',
      'Guadalupe Nuevo', 'Guadalupe Viejo', 'Kasilawan', 'La Paz', 'Magallanes',
      'Olympia', 'Palanan', 'Pembo', 'Pinagkaisahan', 'Pio Del Pilar', 'Pitogo',
      'Poblacion', 'Post Proper Northside', 'Post Proper Southside', 'Rembo',
      'Rizal', 'San Antonio', 'San Isidro', 'San Lorenzo', 'Santa Cruz',
      'Singkamas', 'South Cembo', 'Tejeros', 'Urdaneta', 'Valenzuela', 'West Rembo',
      'Carmona',
    ],
    'Malabon': [
      'Acacia', 'Baritan', 'Bayan-Bayanan', 'Catmon', 'Concepcion',
      'Dampalit', 'Flores', 'Hulong Duhat', 'Ibaba', 'Longos',
      'Muzon', 'Niugan', 'Panghulo', 'Potrero', 'San Agustin',
      'San Jose', 'Santolan', 'Tañong', 'Tinajeros', 'Tonsuya', 'Tugatog',
    ],
    'Mandaluyong': [
      'Addition Hills', 'Bagong Silang', 'Barangka Drive', 'Barangka Ibaba',
      'Barangka Ilaya', 'Barangka Itaas', 'Burol', 'Daang Bakal',
      'Hagdan Bato Itaas', 'Hagdan Bato Libis', 'Harapin ang Bukas',
      'Highway Hills', 'Hulo', 'Mabini-J. Rizal', 'Malamig', 'Mauway',
      'Namayan', 'New Zañiga', 'Old Zañiga', 'Pag-asa', 'Plainview',
      'Pleasant Hills', 'Poblacion', 'San Andres', 'San Isidro',
      'Santa Mesa Heights', 'Wack-Wack Greenhills',
    ],
    'Manila': [
      'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5',
      'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10',
      'Barangay 11', 'Barangay 12', 'Barangay 13', 'Barangay 14', 'Barangay 15',
      'Barangay 16', 'Barangay 17', 'Barangay 18', 'Barangay 19', 'Barangay 20',
      'Barangay 21', 'Barangay 22', 'Barangay 23', 'Barangay 24', 'Barangay 25',
      'Barangay 26', 'Barangay 27', 'Barangay 28', 'Barangay 29', 'Barangay 30',
      'Barangay 31', 'Barangay 32', 'Barangay 33', 'Barangay 34', 'Barangay 35',
      'Barangay 36', 'Barangay 37', 'Barangay 38', 'Barangay 39', 'Barangay 40',
      'Barangay 41', 'Barangay 42', 'Barangay 43', 'Barangay 44', 'Barangay 45',
      'Barangay 46', 'Barangay 47', 'Barangay 48', 'Barangay 49', 'Barangay 50',
      'Barangay 51', 'Barangay 52', 'Barangay 53', 'Barangay 54', 'Barangay 55',
      'Barangay 56', 'Barangay 57', 'Barangay 58', 'Barangay 59', 'Barangay 60',
      'Barangay 61', 'Barangay 62', 'Barangay 63', 'Barangay 64', 'Barangay 65',
      'Barangay 66', 'Barangay 67', 'Barangay 68', 'Barangay 69', 'Barangay 70',
      'Barangay 71', 'Barangay 72', 'Barangay 73', 'Barangay 74', 'Barangay 75',
      'Barangay 76', 'Barangay 77', 'Barangay 78', 'Barangay 79', 'Barangay 80',
      'Barangay 81', 'Barangay 82', 'Barangay 83', 'Barangay 84', 'Barangay 85',
      'Barangay 86', 'Barangay 87', 'Barangay 88', 'Barangay 89', 'Barangay 90',
      'Barangay 91', 'Barangay 92', 'Barangay 93', 'Barangay 94', 'Barangay 95',
      'Barangay 96', 'Barangay 97', 'Barangay 98', 'Barangay 99', 'Barangay 100',
      'Barangay 101', 'Barangay 102', 'Barangay 103', 'Barangay 104', 'Barangay 105',
      'Barangay 106', 'Barangay 107', 'Barangay 108', 'Barangay 109', 'Barangay 110',
      'Barangay 111', 'Barangay 112', 'Barangay 113', 'Barangay 114', 'Barangay 115',
      'Barangay 116', 'Barangay 117', 'Barangay 118', 'Barangay 119', 'Barangay 120',
      'Barangay 121', 'Barangay 122', 'Barangay 123', 'Barangay 124', 'Barangay 125',
      'Barangay 126', 'Barangay 127', 'Barangay 128', 'Barangay 129', 'Barangay 130',
      'Barangay 131', 'Barangay 132', 'Barangay 133', 'Barangay 134', 'Barangay 135',
      'Barangay 136', 'Barangay 137', 'Barangay 138', 'Barangay 139', 'Barangay 140',
      'Barangay 141', 'Barangay 142', 'Barangay 143', 'Barangay 144', 'Barangay 145',
      'Barangay 146', 'Barangay 147', 'Barangay 148', 'Barangay 149', 'Barangay 150',
      'Barangay 151', 'Barangay 152', 'Barangay 153', 'Barangay 154', 'Barangay 155',
      'Barangay 156', 'Barangay 157', 'Barangay 158', 'Barangay 159', 'Barangay 160',
      'Barangay 161', 'Barangay 162', 'Barangay 163', 'Barangay 164', 'Barangay 165',
      'Barangay 166', 'Barangay 167', 'Barangay 168', 'Barangay 169', 'Barangay 170',
      'Barangay 171', 'Barangay 172', 'Barangay 173', 'Barangay 174', 'Barangay 175',
      'Barangay 176', 'Barangay 177', 'Barangay 178', 'Barangay 179', 'Barangay 180',
      'Barangay 181', 'Barangay 182', 'Barangay 183', 'Barangay 184', 'Barangay 185',
      'Barangay 186', 'Barangay 187', 'Barangay 188', 'Barangay 189', 'Barangay 190',
      'Barangay 191', 'Barangay 192', 'Barangay 193', 'Barangay 194', 'Barangay 195',
      'Barangay 196', 'Barangay 197', 'Barangay 198', 'Barangay 199', 'Barangay 200',
      'Barangay 201', 'Barangay 202', 'Barangay 203', 'Barangay 204', 'Barangay 205',
    ],
    'Marikina': [
      'Barangka', 'Calumpang', 'Concepcion Dos', 'Concepcion Uno', 'Fortune',
      'Industrial Valley', 'Jesus dela Peña', 'Malanday', 'Marikina Heights',
      'Nangka', 'Parang', 'San Roque', 'Santa Elena', 'Santo Niño', 'Tañong', 'Tumana',
    ],
    'Muntinlupa': [
      'Alabang', 'Ayala Alabang', 'Bayanan', 'Buli', 'Cupang',
      'New Alabang Village', 'Poblacion', 'Putatan', 'Sucat', 'Tunasan',
    ],
    'Navotas': [
      'Bagumbayan Norte', 'Bagumbayan Sur', 'Bangculasi', 'Daanghari',
      'Navotas East', 'Navotas West', 'North Bay Boulevard Norte',
      'North Bay Boulevard Sur', 'San Jose', 'San Rafael Village',
      'San Roque', 'Sipac-Almacen', 'Tangos', 'Tanza',
    ],
    'Parañaque': [
      'Baclaran', 'BF Homes', 'Don Bosco', 'Don Galo', 'La Huerta',
      'Marcelo Green Village', 'Moonwalk', 'San Antonio', 'San Dionisio',
      'San Isidro', 'San Martin de Porres', 'Santo Niño', 'Sun Valley',
      'Tambo', 'Vitalez', 'Merville',
    ],
    'Pasay': [
      'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5',
      'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10',
      'Barangay 11', 'Barangay 12', 'Barangay 13', 'Barangay 14', 'Barangay 15',
      'Barangay 16', 'Barangay 17', 'Barangay 18', 'Barangay 19', 'Barangay 20',
      'Barangay 21', 'Barangay 22', 'Barangay 23', 'Barangay 24', 'Barangay 25',
      'Barangay 26', 'Barangay 27', 'Barangay 28', 'Barangay 29', 'Barangay 30',
      'Barangay 31', 'Barangay 32', 'Barangay 33', 'Barangay 34', 'Barangay 35',
      'Barangay 36', 'Barangay 37', 'Barangay 38', 'Barangay 39', 'Barangay 40',
      'Barangay 41', 'Barangay 42', 'Barangay 43', 'Barangay 44', 'Barangay 45',
      'Barangay 46', 'Barangay 47', 'Barangay 48', 'Barangay 49', 'Barangay 50',
      'Barangay 51', 'Barangay 52', 'Barangay 53', 'Barangay 54', 'Barangay 55',
      'Barangay 56', 'Barangay 57', 'Barangay 58', 'Barangay 59', 'Barangay 60',
      'Barangay 61', 'Barangay 62', 'Barangay 63', 'Barangay 64', 'Barangay 65',
      'Barangay 66', 'Barangay 67', 'Barangay 68', 'Barangay 69', 'Barangay 70',
      'Barangay 71', 'Barangay 72', 'Barangay 73', 'Barangay 74', 'Barangay 75',
      'Barangay 76', 'Barangay 77',
    ],
    'Pasig': [
      'Bagong Ilog', 'Bagong Katipunan', 'Bambang', 'Buting', 'Caniogan',
      'Dela Paz', 'Kalawaan', 'Kapasigan', 'Kapitolyo', 'Malinao', 'Manggahan',
      'Maybunga', 'Oranbo', 'Palatiw', 'Pinagbuhatan', 'Pineda', 'Rosario',
      'Sagad', 'San Antonio', 'San Joaquin', 'San Jose', 'San Nicolas',
      'Santa Lucia', 'Santa Rosa', 'Santo Tomas', 'Santolan', 'Sumilang', 'Ugong',
      'Wawa', 'Kasiglahan Village',
    ],
    'Pateros': [
      'Aguho', 'Magtanggol', 'Martires del 96', 'Poblacion', 'San Pedro',
      'San Roque', 'Santa Ana', 'Santo Rosario-Kanluran', 'Santo Rosario-Silangan',
      'Tabacalera',
    ],
    'Quezon City': [
      'Alicia', 'Amihan', 'Apolonio Samson', 'Aurora', 'Bagbag',
      'Bagong Pag-asa', 'Bagong Silangan', 'Bagumbayan', 'Bahay Toro',
      'Balingasa', 'Batasan Hills', 'Bayanihan', 'Blue Ridge A', 'Blue Ridge B',
      'Botocan', 'Bug-is', 'Caloocan', 'Camp Aguinaldo', 'Capri', 'Central',
      'Claro', 'Culiat', 'Damayang Lagi', 'Del Monte', 'Diliman',
      'Don Manuel', 'Dona Aurora', 'Dona Faustina I', 'Dona Faustina II',
      'Dona Imelda', 'Dona Josefa', 'E. Rodriguez', 'East Kamias',
      'Fairview', 'Greater Lagro', 'Gulod', 'Holy Spirit', 'Horseshoe',
      'Immaculate Conception', 'Kalusugan', 'Kamuning', 'Katipunan',
      'Kaunlaran', 'Kristong Hari', 'Krus na Ligas', 'Laging Handa',
      'Libis', 'Little Baguio', 'Loyola Heights', 'Maharlika', 'Malaya',
      'Manresa', 'Mariana', 'Mariblo', 'Masambong', 'Matandang Balara',
      'Milagrosa', 'N.S. Amoranto', 'Nagkaisang Nayon', 'New Era',
      'North Fairview', 'Novaliches Proper', 'Obrero', 'Old Capitol Site',
      'Padiwa', 'Pag-ibig sa Nayon', 'Paligsahan', 'Paraiso',
      'Pasong Putik', 'Payatas', 'Phil-Am', 'Pinagkaisahan', 'Pinyahan',
      'Ramon Magsaysay', 'Roxas', 'Sacred Heart', 'Saint Ignatius',
      'Saint Peter', 'Salvacion', 'San Agustin', 'San Antonio',
      'San Bartolome', 'San Isidro Galas', 'San Isidro Labrador',
      'San Jose de la Montana', 'San Martin de Porres', 'San Pedro',
      'Santa Cruz', 'Santa Lucia', 'Santa Monica', 'Santa Teresita',
      'Santo Cristo', 'Santol', 'Sauyo', 'Siena', 'Sikatuna Village',
      'Silangan', 'Socorro', 'South Triangle', 'Talayan', 'Tandang Sora',
      'Tatalon', 'Teachers Village East', 'Teachers Village West',
      'UP Campus', 'UP Village', 'Ugong Norte', 'Vasra', 'Veterans Village',
      'Villa Maria Clara', 'West Kamias', 'West Triangle', 'White Plains',
      'Winston',
    ],
    'San Juan': [
      'Balong-Bato', 'Batis', 'Corazon de Jesus', 'Ermitaño', 'Greenhills',
      'Isabelita', 'Kabayanan', 'Little Baguio', 'Maytunas', 'Onse',
      'Pasadena', 'Pedro Cruz', 'Progreso', 'Rivera', 'Salapan',
      'San Perfecto', 'Santa Lucia', 'Santo Niño', 'West Crame',
      'Addition Hills', 'Tibagan',
    ],
    'Taguig': [
      'Bagong Tanyag', 'Bambang', 'Calzada', 'Central Bicutan',
      'Central Signal Village', 'Fort Bonifacio', 'Hagonoy', 'Ibayo-Tipas',
      'Katuparan', 'Ligid-Tipas', 'Lower Bicutan', 'Maharlika Village',
      'Napindan', 'New Lower Bicutan', 'North Daang Hari', 'North Signal Village',
      'Palingon', 'Pinagsama', 'San Miguel', 'Santa Ana', 'South Daang Hari',
      'South Signal Village', 'Tanyag', 'Tuktukan', 'Upper Bicutan',
      'Ususan', 'Wawa', 'Western Bicutan',
    ],
    'Valenzuela': [
      'Arkong Bato', 'Bagbaguin', 'Balangkas', 'Bignay', 'Bisig', 'Canumay East',
      'Canumay West', 'Coloong', 'Dalandanan', 'Gen. T. De Leon', 'Isla',
      'Karuhatan', 'Lawang Bato', 'Lingunan', 'Mabolo', 'Malanday', 'Malinta',
      'Mapulang Lupa', 'Marulas', 'Maysan', 'Palasan', 'Parada', 'Pariancillo Villa',
      'Paso de Blas', 'Pasolo', 'Poblacion', 'Polo', 'Punturin', 'Rincon',
      'Tagalag', 'Ugong', 'Veinte Reales', 'Wawang Pulo',
    ],
  },

  'Cebu': {
    'Cebu City': [
      'Adlaon', 'Agsungot', 'Apas', 'Babag', 'Bacayan', 'Banilad', 'Basak Pardo',
      'Basak San Nicolas', 'Binaliw', 'Bonbon', 'Budla-an', 'Buhisan', 'Bulacao',
      'Buot-Taup', 'Busay', 'Calamba', 'Cambinocot', 'Capitol Site', 'Carreta',
      'Cogon Pardo', 'Cogon Ramos', 'Day-as', 'Duljo-Fatima', 'Ermita',
      'Guadalupe', 'Guba', 'Hippodromo', 'Inayawan', 'Kalubihan', 'Kalunasan',
      'Kamagayan', 'Kamputhaw', 'Kasambagan', 'Kinasang-an', 'Labangon',
      'Lahug', 'Lorega-San Miguel', 'Lusaran', 'Luz', 'Mabini', 'Mabolo',
      'Malubog', 'Mambaling', 'Nivel Hills', 'Pahina Central', 'Pahina San Nicolas',
      'Pamutan', 'Pardo', 'Parian', 'Paril', 'Pasil', 'Pit-os', 'Poblacion Pardo',
      'Pulangbato', 'Pung-ol-Sibugay', 'Punta Princesa', 'Quiot Pardo',
      'Sambag I', 'Sambag II', 'San Antonio', 'San Jose', 'San Nicolas Central',
      'San Nicolas Proper', 'San Roque', 'Santa Cruz', 'Santo Niño',
      'Sapangdaku', 'Sawang Calero', 'Sinsin', 'Sirao', 'Suba', 'Sudlon I',
      'Sudlon II', 'T. Padilla', 'Tabunan', 'Tagba-o', 'Talamban', 'Taptap',
      'Tejero', 'Tinago', 'Tisa', 'Toong', 'Tuburan', 'Tungkop',
    ],
    'Mandaue': [
      'Alang-Alang', 'Bakilid', 'Banilad', 'Basak', 'Cabancalan', 'Cambaro',
      'Canduman', 'Casili', 'Casuntingan', 'Centro', 'Cubacub', 'Guizo',
      'Ibabao-Estancia', 'Jagobiao', 'Labogon', 'Looc', 'Maguikay', 'Mantuyong',
      'Opao', 'Pakna-an', 'Paknaan', 'Subangdaku', 'Tabok', 'Tawason',
      'Tingub', 'Tipolo', 'Umapad',
    ],
    'Cordova': [
      'Alegria', 'Bangbang', 'Buagsong', 'Catarman', 'Cogon', 'Dapitan',
      'Day-as', 'Gabi', 'Gilutongan', 'Ibabao', 'Kalawisan', 'Pilipog',
      'Poblacion', 'San Miguel',
    ],
    'Lapu-Lapu': [
      'Agus', 'Babag', 'Bankal', 'Baring', 'Basak', 'Buaya', 'Calawisan',
      'Canjulao', 'Caubian', 'Caw-oy', 'Cawhagan', 'Consolacion', 'Gun-ob',
      'Ibo', 'Looc', 'Mactan', 'Maribago', 'Marigondon', 'Pajac', 'Pajo',
      'Punta Engaño', 'Pusok', 'Sabang', 'Santa Rosa', 'Subabasbas',
      'Talima', 'Tingo', 'Tungasan',
    ],
  },

  'Davao del Sur': {
    'Davao City': [
      'Acacia', 'Agdao', 'Alambre', 'Alejandra Navarro', 'Alfonso Angliongto Sr.',
      'Angalan', 'Atan-Awe', 'Baganihan', 'Bago Aplaya', 'Bago Gallera',
      'Bago Oshiro', 'Baguio', 'Balengaeng', 'Baliok', 'Bangkas Heights',
      'Baracatan', 'Barangay 1-A', 'Barangay 2-A', 'Barangay 3-A', 'Barangay 4-A',
      'Barangay 5-A', 'Barangay 6-A', 'Barangay 7-A', 'Barangay 8-A',
      'Barangay 9-A', 'Barangay 10-A', 'Barangay 11-B', 'Barangay 12-B',
      'Barangay 13-B', 'Barangay 14-B', 'Barangay 15-B', 'Barangay 16-B',
      'Barangay 17-B', 'Barangay 18-B', 'Barangay 19-B', 'Barangay 20-B',
      'Barangay 21-C', 'Barangay 22-C', 'Barangay 23-C', 'Barangay 24-C',
      'Barangay 25-C', 'Barangay 26-C', 'Barangay 27-C', 'Barangay 28-C',
      'Barangay 29-C', 'Barangay 30-C', 'Barangay 31-D', 'Barangay 32-D',
      'Barangay 33-D', 'Barangay 34-D', 'Barangay 35-D', 'Barangay 36-D',
      'Barangay 37-D', 'Barangay 38-D', 'Barangay 39-D', 'Barangay 40-D',
      'Buhangin', 'Bunawan', 'Calinan', 'Colosas', 'Communal', 'Cugman',
      'Daniel Fernandez', 'Datu Salumay', 'Dumoy', 'Eden', 'Fatima',
      'Gatungan', 'Gov. Paciano Bangoy', 'Gov. Vicente Duterte',
      'Gumalang', 'Guuso', 'Indangan', 'Kap. Tomas Monteverde Sr.',
      'Lacson', 'Lamanan', 'Lampianao', 'Lasang', 'Lizada', 'Los Amigos',
      'Lubogan', 'Lumiad', 'Ma-a', 'Mabuhay', 'Malagos', 'Malamba',
      'Manambulan', 'Mandug', 'Manuel Guianga', 'Mapula', 'Marapangi',
      'Marilog', 'Matina Aplaya', 'Matina Crossing', 'Matina Pangi',
      'Megkawayan', 'Mintal', 'Mudiang', 'Mulig', 'New Carmen',
      'New Valencia', 'Pampanga', 'Panacan', 'Panalum', 'Pangyan',
      'Paquibato', 'Paradise Embak', 'Rafael Castillo', 'Riverside',
      'Saliducon', 'Samal', 'San Antonio', 'Santos', 'Sasa',
      'Sirib', 'Sirawan', 'Sirib', 'Suawan', 'Subasta',
      'Tacunan', 'Tagakpan', 'Tagluno', 'Tagurano', 'Talomo',
      'Tamayong', 'Tamugan', 'Tapak', 'Tawan-tawan', 'Tibuloy',
      'Tibungco', 'Tigatto', 'Toril', 'Tugbok', 'Tungkalan',
      'Ubalde', 'Ula', 'Vicente Hizon Sr.', 'Waan', 'Wilfredo Aquino',
    ],
  },

  'Quezon': {
    'Lucena City': [
      'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV', 'Barangay V',
      'Barangay VI', 'Barangay VII', 'Barangay VIII', 'Barangay IX', 'Barangay X',
      'Gulang-Gulang', 'Ilayang Dupay', 'Ibabang Dupay', 'Ibabang Iyam',
      'Ilayang Iyam', 'Isabang', 'Almanza', 'Barra', 'Bocohan',
      'Cotta', 'Dalahican', 'Domoit', 'Ibabang Talim', 'Ilayang Talim',
      'Kanlurang Mayao', 'Mayao Crossing', 'Mayao Kanluran', 'Mayao Parada',
      'Mayao Silangan', 'Palale', 'Ransohan', 'Salinas', 'Silangang Mayao',
      'Tictic', 'Bantayan', 'Market View', 'Talao-Talao',
      'Carbon', 'Kapitan Kilyong', 'Malibay', 'Reparo',
    ],
  },

  'Batangas': {
    'Batangas City': [
      'Alangilan', 'Balagtas', 'Balete', 'Banaba Center', 'Banaba East',
      'Banaba Ibaba', 'Banaba West', 'Banaybanay', 'Bilogo', 'Bolbok',
      'Brgy. 1', 'Brgy. 2', 'Brgy. 3', 'Brgy. 4', 'Brgy. 5', 'Brgy. 6',
      'Brgy. 7', 'Brgy. 8', 'Brgy. 9', 'Brgy. 10', 'Brgy. 11', 'Brgy. 12',
      'Brgy. 13', 'Brgy. 14', 'Brgy. 15', 'Brgy. 16', 'Brgy. 17', 'Brgy. 18',
      'Brgy. 19', 'Brgy. 20', 'Brgy. 21', 'Brgy. 22', 'Brgy. 23', 'Brgy. 24',
      'Cuta', 'Kumintang Ibaba', 'Kumintang Ilaya', 'Libjo', 'Liponpon',
      'Malitam', 'Pallocan East', 'Pallocan West', 'Sampaga', 'San Isidro',
      'San Jose Sico', 'Sta. Clara', 'Sta. Rita Aplaya', 'Sta. Rita Karsada',
      'Tinga Itaas', 'Tinga Labac', 'Tingga Itaas', 'Wawa',
    ],
    'Lipa City': [
      'Antipolo del Norte', 'Antipolo del Sur', 'Bagong Pook', 'Balintawak',
      'Banaybanay', 'Bolbok', 'Bugtong na Pulo', 'Bulacnin', 'Bulacan',
      'Calamias', 'Cumba', 'Dagatan', 'Duhatan', 'Halang', 'Inosluban',
      'Kayumanggi', 'Latag', 'Lodlod', 'Lumbang', 'Mabini', 'Mataas na Lupa',
      'Munting Pulo', 'Pagolingin Bata', 'Pagolingin East', 'Pagolingin West',
      'Pangao', 'Pinagkawitan', 'Pinagtongulan', 'Plaridel', 'Poblacion Barangay 1',
      'Poblacion Barangay 2', 'Poblacion Barangay 3', 'Poblacion Barangay 4',
      'Poblacion Barangay 5', 'Poblacion Barangay 6', 'Poblacion Barangay 7',
      'Poblacion Barangay 8', 'Poblacion Barangay 9', 'Poblacion Barangay 10',
      'Poblacion Barangay 11', 'Sabang', 'Sampalokan', 'San Benito',
      'San Carlos', 'San Celestino', 'San Francisco', 'San Guillermo',
      'San Jose', 'San Lucas', 'San Salvador', 'San Sebastian',
      'Santa Cruz', 'Talisay', 'Tambo', 'Tangob', 'Tanguay',
    ],
  },

  'Laguna': {
    'Santa Rosa': [
      'Aplaya', 'Balibago', 'Caingin', 'Dita', 'Dulo', 'Ibaba', 'Kanluran',
      'Labas', 'Macabling', 'Malitlit', 'Malusak', 'Market Area', 'Pooc',
      'Pook', 'Pulo', 'Tagapo',
    ],
    'Calamba': [
      'Bagong Kalsada', 'Banadero', 'Banlic', 'Barandal', 'Batino', 'Bubuyan',
      'Bucal', 'Bunggo', 'Burol', 'Camaligan', 'Canlubang', 'Halang',
      'Hornalan', 'Kay-anlog', 'La Mesa', 'Laguerta', 'Lawa', 'Lecheria',
      'Lingga', 'Looc', 'Mabato', 'Makiling', 'Mapagong', 'Masili',
      'Maunong', 'Mayapa', 'Milagrosa', 'Paciano Rizal', 'Palo-alto',
      'Pansol', 'Parian', 'Prinza', 'Punta', 'Puting Lupa', 'Real',
      'Saimsim', 'Sampiruhan', 'San Cristobal', 'San Jose', 'San Juan',
      'Sirang Lupa', 'Sucol', 'Turbina', 'Utog', 'Villa Rey', 'Wawa',
    ],
  },

  'Cavite': {
    'Bacoor': [
      'Alima', 'Aniban I', 'Aniban II', 'Aniban III', 'Aniban IV', 'Aniban V',
      'Banalo', 'Bayanan', 'Campo Santo', 'Dagatan', 'Dulong Bayan',
      'Habay I', 'Habay II', 'Kaingin', 'Ligas I', 'Ligas II', 'Ligas III',
      'Mabolo I', 'Mabolo II', 'Mabolo III', 'Maliksi I', 'Maliksi II',
      'Maliksi III', 'Mambog I', 'Mambog II', 'Mambog III', 'Mambog IV',
      'Mambog V', 'Molino I', 'Molino II', 'Molino III', 'Molino IV',
      'Molino V', 'Molino VI', 'Palico I', 'Palico II', 'Palico III',
      'Palico IV', 'Panapaan I', 'Panapaan II', 'Panapaan III', 'Panapaan IV',
      'Panapaan V', 'Panapaan VI', 'Panapaan VII', 'Panapaan VIII',
      'Queens Row Central', 'Queens Row East', 'Queens Row West',
      'Real I', 'Real II', 'Salinas I', 'Salinas II', 'Salinas III',
      'Salinas IV', 'San Nicolas I', 'San Nicolas II', 'San Nicolas III',
      'Sineguelasan', 'Soldiers Hills I', 'Soldiers Hills II',
      'Soldiers Hills III', 'Soldiers Hills IV', 'Talaba I', 'Talaba II',
      'Talaba III', 'Talaba IV', 'Talaba V', 'Talaba VI', 'Talaba VII',
      'Zapote I', 'Zapote II', 'Zapote III', 'Zapote IV', 'Zapote V',
    ],
    'Imus': [
      'Alapan I-A', 'Alapan I-B', 'Alapan I-C', 'Alapan II-A', 'Alapan II-B',
      'Anabu I-A', 'Anabu I-B', 'Anabu I-C', 'Anabu I-D', 'Anabu I-E',
      'Anabu I-F', 'Anabu I-G', 'Anabu II-A', 'Anabu II-B', 'Anabu II-C',
      'Anabu II-D', 'Anabu II-E', 'Anabu II-F', 'Bagong Silang',
      'Bayan Luma I', 'Bayan Luma II', 'Bayan Luma III', 'Bayan Luma IV',
      'Bayan Luma V', 'Bayan Luma VI', 'Bayan Luma VII', 'Bayan Luma VIII',
      'Bayan Luma IX', 'Bucandala I', 'Bucandala II', 'Bucandala III',
      'Bucandala IV', 'Bucandala V', 'Carsadang Bago I', 'Carsadang Bago II',
      'Malagasang I-A', 'Malagasang I-B', 'Malagasang I-C', 'Malagasang I-D',
      'Malagasang I-E', 'Malagasang I-F', 'Malagasang I-G',
      'Malagasang II-A', 'Malagasang II-B', 'Malagasang II-C',
      'Malagasang II-D', 'Malagasang II-E', 'Malagasang II-F',
      'Malagasang II-G', 'Mariano Espeleta I', 'Mariano Espeleta II',
      'Mariano Espeleta III', 'Medicion I-A', 'Medicion I-B', 'Medicion I-C',
      'Medicion I-D', 'Medicion II-A', 'Medicion II-B', 'Medicion II-C',
      'Medicion II-D', 'Medicion II-E', 'Medicion II-F',
      'Palico I', 'Palico II', 'Palico III', 'Palico IV',
      'Pasong Buaya I', 'Pasong Buaya II', 'Poblacion I-A', 'Poblacion I-B',
      'Poblacion I-C', 'Poblacion II-A', 'Poblacion II-B', 'Poblacion III-A',
      'Poblacion III-B', 'Poblacion IV-A', 'Poblacion IV-B', 'Poblacion IV-C',
      'Tanzang Luma I', 'Tanzang Luma II', 'Tanzang Luma III',
      'Tanzang Luma IV', 'Tanzang Luma V', 'Tanzang Luma VI',
      'Tinabunan', 'Toclong I-A', 'Toclong I-B', 'Toclong I-C',
      'Toclong II-A', 'Toclong II-B',
    ],
  },

  'Rizal': {
    'Antipolo': [
      'Bagong Nayon', 'Beverly Hills', 'Calawis', 'Cupang', 'Dalig',
      'Dela Paz', 'Inarawan', 'Mambugan', 'Mayamot', 'Muntingdilaw',
      'San Isidro', 'San Jose', 'San Juan', 'San Luis', 'San Roque',
      'Santa Cruz', 'Santo Niño',
    ],
  },

  'Bulacan': {
    'Malolos': [
      'Anilao', 'Atlag', 'Babatnin', 'Bagna', 'Bagong Bayan', 'Balayong',
      'Balite', 'Bangkal', 'Barihan', 'Caingin', 'Calero', 'Calizon',
      'Canate', 'Catmon', 'Cofradia', 'Colo', 'Dakila', 'Guinhawa',
      'Liang', 'Ligas', 'Liyang', 'Longos', 'Look 1st', 'Look 2nd',
      'Lugam', 'Mabolo', 'Mambog', 'Masile', 'Matimbo', 'Mojon',
      'Namayan', 'Niugan', 'Pamarawan', 'Panasahan', 'Pinagbakahan',
      'San Agustin', 'San Gabriel', 'San Juan', 'San Pablo', 'San Vicente',
      'Santiago', 'Santo Cristo', 'Santo Niño', 'Santo Rosario', 'Santol',
      'Sumapang Bata', 'Sumapang Matanda', 'Taal', 'Tikay',
    ],
  },

  'Pampanga': {
    'Angeles': [
      'Agapito del Rosario', 'Amsic', 'Anunas', 'Balibago', 'Capaya',
      'Claro M. Recto', 'Cuayan', 'Cutcut', 'Cutud', 'Lourdes Norte',
      'Lourdes Sur', 'Lourdes Sur East', 'Malabanias', 'Margot', 'Mining',
      'Ninoy Aquino', 'Pampang', 'Pandan', 'Pulung Cacutud', 'Pulung Maragul',
      'Pulungmasle', 'Salapungan', 'San Jose', 'San Nicolas',
      'Santa Trinita', 'Santo Cristo', 'Santo Domingo', 'Santo Rosario',
      'Sapalibutad', 'Sapangbato', 'Tabun', 'Virgen Delos Remedios',
    ],
    'San Fernando': [
      'Alasas', 'Baliti', 'Bulaon', 'Calulut', 'Del Carmen', 'Del Pilar',
      'Del Rosario', 'Dolores', 'Juliana', 'Lara', 'Lourdes',
      'Magliman', 'Maimpis', 'Malino', 'Malpitic', 'Pandaras',
      'Panipuan', 'Pulung Bulu', 'Quebiawan', 'Saguin', 'San Agustin',
      'San Felipe', 'San Isidro', 'San Jose', 'San Juan', 'San Nicolas',
      'San Pedro', 'Santa Lucia', 'Santa Teresa', 'Santiago',
      'Santo Niño', 'Santo Rosario', 'Sindalan', 'Telabastagan',
    ],
  },
};

// Reverse lookup index built at module load: lowercase barangay → {city, province}
const _index = new Map<string, { city: string; province: string }>();

for (const [province, cities] of Object.entries(PH_GEO)) {
  for (const [city, barangays] of Object.entries(cities)) {
    for (const barangay of barangays) {
      _index.set(barangay.toLowerCase(), { city, province });
    }
  }
}

// Returns city + province for an exact-matched barangay name (case-insensitive)
export function getLocationByBarangay(barangay: string): { city: string; province: string } | null {
  return _index.get(barangay.toLowerCase()) ?? null;
}

// All unique barangay names (for datalist / autocomplete)
export function getAllBarangays(): string[] {
  const names: string[] = [];
  for (const cities of Object.values(PH_GEO)) {
    for (const barangays of Object.values(cities)) {
      for (const b of barangays) {
        names.push(b);
      }
    }
  }
  return [...new Set(names)].sort();
}

// All cities for a province
export function getCitiesForProvince(province: string): string[] {
  return Object.keys(PH_GEO[province] ?? {});
}

// All barangays for a city
export function getBarangaysForCity(city: string): string[] {
  for (const cities of Object.values(PH_GEO)) {
    if (cities[city]) return cities[city];
  }
  return [];
}

export const COUNTRY_DEFAULT = 'Philippines';
