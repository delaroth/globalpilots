// Geolocation utilities

interface GeolocationResult {
  city: string
  airportCode: string
}

/**
 * Comprehensive list of major airports worldwide
 * Organized by region for easy navigation
 */
export const majorAirports = [
  // ============================================================
  // NORTH AMERICA - USA
  // ============================================================
  { code: 'ATL', city: 'Atlanta', country: 'USA', region: 'North America' },
  { code: 'AUS', city: 'Austin', country: 'USA', region: 'North America' },
  { code: 'BNA', city: 'Nashville', country: 'USA', region: 'North America' },
  { code: 'BOS', city: 'Boston', country: 'USA', region: 'North America' },
  { code: 'BWI', city: 'Baltimore', country: 'USA', region: 'North America' },
  { code: 'CLE', city: 'Cleveland', country: 'USA', region: 'North America' },
  { code: 'CLT', city: 'Charlotte', country: 'USA', region: 'North America' },
  { code: 'CVG', city: 'Cincinnati', country: 'USA', region: 'North America' },
  { code: 'DCA', city: 'Washington Reagan', country: 'USA', region: 'North America' },
  { code: 'DEN', city: 'Denver', country: 'USA', region: 'North America' },
  { code: 'DFW', city: 'Dallas', country: 'USA', region: 'North America' },
  { code: 'DTW', city: 'Detroit', country: 'USA', region: 'North America' },
  { code: 'EWR', city: 'Newark', country: 'USA', region: 'North America' },
  { code: 'FLL', city: 'Fort Lauderdale', country: 'USA', region: 'North America' },
  { code: 'HNL', city: 'Honolulu', country: 'USA', region: 'North America' },
  { code: 'HOU', city: 'Houston Hobby', country: 'USA', region: 'North America' },
  { code: 'IAH', city: 'Houston', country: 'USA', region: 'North America' },
  { code: 'IAD', city: 'Washington Dulles', country: 'USA', region: 'North America' },
  { code: 'IND', city: 'Indianapolis', country: 'USA', region: 'North America' },
  { code: 'JAX', city: 'Jacksonville', country: 'USA', region: 'North America' },
  { code: 'JFK', city: 'New York JFK', country: 'USA', region: 'North America' },
  { code: 'LAS', city: 'Las Vegas', country: 'USA', region: 'North America' },
  { code: 'LAX', city: 'Los Angeles', country: 'USA', region: 'North America' },
  { code: 'LGA', city: 'New York LaGuardia', country: 'USA', region: 'North America' },
  { code: 'MCI', city: 'Kansas City', country: 'USA', region: 'North America' },
  { code: 'MCO', city: 'Orlando', country: 'USA', region: 'North America' },
  { code: 'MDW', city: 'Chicago Midway', country: 'USA', region: 'North America' },
  { code: 'MEM', city: 'Memphis', country: 'USA', region: 'North America' },
  { code: 'MIA', city: 'Miami', country: 'USA', region: 'North America' },
  { code: 'MKE', city: 'Milwaukee', country: 'USA', region: 'North America' },
  { code: 'MSP', city: 'Minneapolis', country: 'USA', region: 'North America' },
  { code: 'MSY', city: 'New Orleans', country: 'USA', region: 'North America' },
  { code: 'OAK', city: 'Oakland', country: 'USA', region: 'North America' },
  { code: 'OGG', city: 'Maui', country: 'USA', region: 'North America' },
  { code: 'ONT', city: 'Ontario CA', country: 'USA', region: 'North America' },
  { code: 'ORD', city: 'Chicago', country: 'USA', region: 'North America' },
  { code: 'PBI', city: 'West Palm Beach', country: 'USA', region: 'North America' },
  { code: 'PDX', city: 'Portland', country: 'USA', region: 'North America' },
  { code: 'PHL', city: 'Philadelphia', country: 'USA', region: 'North America' },
  { code: 'PHX', city: 'Phoenix', country: 'USA', region: 'North America' },
  { code: 'PIT', city: 'Pittsburgh', country: 'USA', region: 'North America' },
  { code: 'RDU', city: 'Raleigh', country: 'USA', region: 'North America' },
  { code: 'RSW', city: 'Fort Myers', country: 'USA', region: 'North America' },
  { code: 'SAN', city: 'San Diego', country: 'USA', region: 'North America' },
  { code: 'SAT', city: 'San Antonio', country: 'USA', region: 'North America' },
  { code: 'SEA', city: 'Seattle', country: 'USA', region: 'North America' },
  { code: 'SFO', city: 'San Francisco', country: 'USA', region: 'North America' },
  { code: 'SJC', city: 'San Jose', country: 'USA', region: 'North America' },
  { code: 'SLC', city: 'Salt Lake City', country: 'USA', region: 'North America' },
  { code: 'SMF', city: 'Sacramento', country: 'USA', region: 'North America' },
  { code: 'SNA', city: 'Orange County', country: 'USA', region: 'North America' },
  { code: 'STL', city: 'St. Louis', country: 'USA', region: 'North America' },
  { code: 'TPA', city: 'Tampa', country: 'USA', region: 'North America' },

  // ============================================================
  // NORTH AMERICA - Canada
  // ============================================================
  { code: 'YVR', city: 'Vancouver', country: 'Canada', region: 'North America' },
  { code: 'YYC', city: 'Calgary', country: 'Canada', region: 'North America' },
  { code: 'YYZ', city: 'Toronto', country: 'Canada', region: 'North America' },
  { code: 'YUL', city: 'Montreal', country: 'Canada', region: 'North America' },
  { code: 'YOW', city: 'Ottawa', country: 'Canada', region: 'North America' },
  { code: 'YEG', city: 'Edmonton', country: 'Canada', region: 'North America' },
  { code: 'YHZ', city: 'Halifax', country: 'Canada', region: 'North America' },
  { code: 'YWG', city: 'Winnipeg', country: 'Canada', region: 'North America' },
  { code: 'YQB', city: 'Quebec City', country: 'Canada', region: 'North America' },

  // ============================================================
  // NORTH AMERICA - Mexico
  // ============================================================
  { code: 'MEX', city: 'Mexico City', country: 'Mexico', region: 'North America' },
  { code: 'CUN', city: 'Cancun', country: 'Mexico', region: 'North America' },
  { code: 'GDL', city: 'Guadalajara', country: 'Mexico', region: 'North America' },
  { code: 'MTY', city: 'Monterrey', country: 'Mexico', region: 'North America' },
  { code: 'SJD', city: 'San Jose del Cabo', country: 'Mexico', region: 'North America' },
  { code: 'PVR', city: 'Puerto Vallarta', country: 'Mexico', region: 'North America' },
  { code: 'TIJ', city: 'Tijuana', country: 'Mexico', region: 'North America' },

  // ============================================================
  // EUROPE - UK & Ireland
  // ============================================================
  { code: 'LHR', city: 'London Heathrow', country: 'UK', region: 'Europe' },
  { code: 'LGW', city: 'London Gatwick', country: 'UK', region: 'Europe' },
  { code: 'STN', city: 'London Stansted', country: 'UK', region: 'Europe' },
  { code: 'LTN', city: 'London Luton', country: 'UK', region: 'Europe' },
  { code: 'MAN', city: 'Manchester', country: 'UK', region: 'Europe' },
  { code: 'EDI', city: 'Edinburgh', country: 'UK', region: 'Europe' },
  { code: 'BHX', city: 'Birmingham', country: 'UK', region: 'Europe' },
  { code: 'BRS', city: 'Bristol', country: 'UK', region: 'Europe' },
  { code: 'GLA', city: 'Glasgow', country: 'UK', region: 'Europe' },
  { code: 'NCL', city: 'Newcastle', country: 'UK', region: 'Europe' },
  { code: 'LPL', city: 'Liverpool', country: 'UK', region: 'Europe' },
  { code: 'BFS', city: 'Belfast', country: 'UK', region: 'Europe' },
  { code: 'DUB', city: 'Dublin', country: 'Ireland', region: 'Europe' },
  { code: 'SNN', city: 'Shannon', country: 'Ireland', region: 'Europe' },
  { code: 'ORK', city: 'Cork', country: 'Ireland', region: 'Europe' },

  // ============================================================
  // EUROPE - France
  // ============================================================
  { code: 'CDG', city: 'Paris CDG', country: 'France', region: 'Europe' },
  { code: 'ORY', city: 'Paris Orly', country: 'France', region: 'Europe' },
  { code: 'NCE', city: 'Nice', country: 'France', region: 'Europe' },
  { code: 'LYS', city: 'Lyon', country: 'France', region: 'Europe' },
  { code: 'MRS', city: 'Marseille', country: 'France', region: 'Europe' },
  { code: 'TLS', city: 'Toulouse', country: 'France', region: 'Europe' },
  { code: 'BOD', city: 'Bordeaux', country: 'France', region: 'Europe' },
  { code: 'NTE', city: 'Nantes', country: 'France', region: 'Europe' },

  // ============================================================
  // EUROPE - Germany
  // ============================================================
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', region: 'Europe' },
  { code: 'MUC', city: 'Munich', country: 'Germany', region: 'Europe' },
  { code: 'BER', city: 'Berlin', country: 'Germany', region: 'Europe' },
  { code: 'DUS', city: 'Dusseldorf', country: 'Germany', region: 'Europe' },
  { code: 'HAM', city: 'Hamburg', country: 'Germany', region: 'Europe' },
  { code: 'CGN', city: 'Cologne', country: 'Germany', region: 'Europe' },
  { code: 'STR', city: 'Stuttgart', country: 'Germany', region: 'Europe' },
  { code: 'HAJ', city: 'Hannover', country: 'Germany', region: 'Europe' },
  { code: 'NUE', city: 'Nuremberg', country: 'Germany', region: 'Europe' },

  // ============================================================
  // EUROPE - Benelux
  // ============================================================
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', region: 'Europe' },
  { code: 'EIN', city: 'Eindhoven', country: 'Netherlands', region: 'Europe' },
  { code: 'BRU', city: 'Brussels', country: 'Belgium', region: 'Europe' },
  { code: 'CRL', city: 'Brussels Charleroi', country: 'Belgium', region: 'Europe' },
  { code: 'LUX', city: 'Luxembourg', country: 'Luxembourg', region: 'Europe' },

  // ============================================================
  // EUROPE - Switzerland & Austria
  // ============================================================
  { code: 'ZRH', city: 'Zurich', country: 'Switzerland', region: 'Europe' },
  { code: 'GVA', city: 'Geneva', country: 'Switzerland', region: 'Europe' },
  { code: 'BSL', city: 'Basel', country: 'Switzerland', region: 'Europe' },
  { code: 'VIE', city: 'Vienna', country: 'Austria', region: 'Europe' },
  { code: 'SZG', city: 'Salzburg', country: 'Austria', region: 'Europe' },
  { code: 'INN', city: 'Innsbruck', country: 'Austria', region: 'Europe' },

  // ============================================================
  // EUROPE - Spain
  // ============================================================
  { code: 'MAD', city: 'Madrid', country: 'Spain', region: 'Europe' },
  { code: 'BCN', city: 'Barcelona', country: 'Spain', region: 'Europe' },
  { code: 'AGP', city: 'Malaga', country: 'Spain', region: 'Europe' },
  { code: 'VLC', city: 'Valencia', country: 'Spain', region: 'Europe' },
  { code: 'SVQ', city: 'Seville', country: 'Spain', region: 'Europe' },
  { code: 'PMI', city: 'Palma de Mallorca', country: 'Spain', region: 'Europe' },
  { code: 'ALC', city: 'Alicante', country: 'Spain', region: 'Europe' },
  { code: 'TFS', city: 'Tenerife South', country: 'Spain', region: 'Europe' },
  { code: 'LPA', city: 'Gran Canaria', country: 'Spain', region: 'Europe' },
  { code: 'IBZ', city: 'Ibiza', country: 'Spain', region: 'Europe' },
  { code: 'BIO', city: 'Bilbao', country: 'Spain', region: 'Europe' },

  // ============================================================
  // EUROPE - Italy
  // ============================================================
  { code: 'FCO', city: 'Rome', country: 'Italy', region: 'Europe' },
  { code: 'MXP', city: 'Milan Malpensa', country: 'Italy', region: 'Europe' },
  { code: 'LIN', city: 'Milan Linate', country: 'Italy', region: 'Europe' },
  { code: 'VCE', city: 'Venice', country: 'Italy', region: 'Europe' },
  { code: 'NAP', city: 'Naples', country: 'Italy', region: 'Europe' },
  { code: 'FLR', city: 'Florence', country: 'Italy', region: 'Europe' },
  { code: 'BLQ', city: 'Bologna', country: 'Italy', region: 'Europe' },
  { code: 'CTA', city: 'Catania', country: 'Italy', region: 'Europe' },
  { code: 'PMO', city: 'Palermo', country: 'Italy', region: 'Europe' },
  { code: 'PSA', city: 'Pisa', country: 'Italy', region: 'Europe' },
  { code: 'TRN', city: 'Turin', country: 'Italy', region: 'Europe' },
  { code: 'BRI', city: 'Bari', country: 'Italy', region: 'Europe' },

  // ============================================================
  // EUROPE - Portugal
  // ============================================================
  { code: 'LIS', city: 'Lisbon', country: 'Portugal', region: 'Europe' },
  { code: 'OPO', city: 'Porto', country: 'Portugal', region: 'Europe' },
  { code: 'FAO', city: 'Faro', country: 'Portugal', region: 'Europe' },
  { code: 'FNC', city: 'Funchal Madeira', country: 'Portugal', region: 'Europe' },
  { code: 'PDL', city: 'Ponta Delgada Azores', country: 'Portugal', region: 'Europe' },

  // ============================================================
  // EUROPE - Greece
  // ============================================================
  { code: 'ATH', city: 'Athens', country: 'Greece', region: 'Europe' },
  { code: 'SKG', city: 'Thessaloniki', country: 'Greece', region: 'Europe' },
  { code: 'HER', city: 'Heraklion Crete', country: 'Greece', region: 'Europe' },
  { code: 'RHO', city: 'Rhodes', country: 'Greece', region: 'Europe' },
  { code: 'CFU', city: 'Corfu', country: 'Greece', region: 'Europe' },
  { code: 'JMK', city: 'Mykonos', country: 'Greece', region: 'Europe' },
  { code: 'JTR', city: 'Santorini', country: 'Greece', region: 'Europe' },
  { code: 'KGS', city: 'Kos', country: 'Greece', region: 'Europe' },
  { code: 'CHQ', city: 'Chania Crete', country: 'Greece', region: 'Europe' },
  { code: 'ZTH', city: 'Zakynthos', country: 'Greece', region: 'Europe' },

  // ============================================================
  // EUROPE - Cyprus
  // ============================================================
  { code: 'LCA', city: 'Larnaca', country: 'Cyprus', region: 'Europe' },
  { code: 'PFO', city: 'Paphos', country: 'Cyprus', region: 'Europe' },

  // ============================================================
  // EUROPE - Malta
  // ============================================================
  { code: 'MLA', city: 'Malta', country: 'Malta', region: 'Europe' },

  // ============================================================
  // EUROPE - Nordic Countries
  // ============================================================
  { code: 'ARN', city: 'Stockholm', country: 'Sweden', region: 'Europe' },
  { code: 'GOT', city: 'Gothenburg', country: 'Sweden', region: 'Europe' },
  { code: 'CPH', city: 'Copenhagen', country: 'Denmark', region: 'Europe' },
  { code: 'OSL', city: 'Oslo', country: 'Norway', region: 'Europe' },
  { code: 'BGO', city: 'Bergen', country: 'Norway', region: 'Europe' },
  { code: 'TRD', city: 'Trondheim', country: 'Norway', region: 'Europe' },
  { code: 'HEL', city: 'Helsinki', country: 'Finland', region: 'Europe' },
  { code: 'KEF', city: 'Reykjavik', country: 'Iceland', region: 'Europe' },

  // ============================================================
  // EUROPE - Eastern Europe & Balkans
  // ============================================================
  { code: 'WAW', city: 'Warsaw', country: 'Poland', region: 'Europe' },
  { code: 'KRK', city: 'Krakow', country: 'Poland', region: 'Europe' },
  { code: 'GDN', city: 'Gdansk', country: 'Poland', region: 'Europe' },
  { code: 'WRO', city: 'Wroclaw', country: 'Poland', region: 'Europe' },
  { code: 'PRG', city: 'Prague', country: 'Czech Republic', region: 'Europe' },
  { code: 'BUD', city: 'Budapest', country: 'Hungary', region: 'Europe' },
  { code: 'OTP', city: 'Bucharest', country: 'Romania', region: 'Europe' },
  { code: 'CLJ', city: 'Cluj-Napoca', country: 'Romania', region: 'Europe' },
  { code: 'SOF', city: 'Sofia', country: 'Bulgaria', region: 'Europe' },
  { code: 'VAR', city: 'Varna', country: 'Bulgaria', region: 'Europe' },
  { code: 'BEG', city: 'Belgrade', country: 'Serbia', region: 'Europe' },
  { code: 'ZAG', city: 'Zagreb', country: 'Croatia', region: 'Europe' },
  { code: 'SPU', city: 'Split', country: 'Croatia', region: 'Europe' },
  { code: 'DBV', city: 'Dubrovnik', country: 'Croatia', region: 'Europe' },
  { code: 'LJU', city: 'Ljubljana', country: 'Slovenia', region: 'Europe' },
  { code: 'SKP', city: 'Skopje', country: 'North Macedonia', region: 'Europe' },
  { code: 'TIA', city: 'Tirana', country: 'Albania', region: 'Europe' },
  { code: 'SJJ', city: 'Sarajevo', country: 'Bosnia', region: 'Europe' },
  { code: 'TGD', city: 'Podgorica', country: 'Montenegro', region: 'Europe' },
  { code: 'RIX', city: 'Riga', country: 'Latvia', region: 'Europe' },
  { code: 'TLL', city: 'Tallinn', country: 'Estonia', region: 'Europe' },
  { code: 'VNO', city: 'Vilnius', country: 'Lithuania', region: 'Europe' },
  { code: 'KBP', city: 'Kyiv', country: 'Ukraine', region: 'Europe' },
  { code: 'ODS', city: 'Odesa', country: 'Ukraine', region: 'Europe' },
  { code: 'KIV', city: 'Chisinau', country: 'Moldova', region: 'Europe' },
  { code: 'MSQ', city: 'Minsk', country: 'Belarus', region: 'Europe' },
  { code: 'TBS', city: 'Tbilisi', country: 'Georgia', region: 'Europe' },
  { code: 'EVN', city: 'Yerevan', country: 'Armenia', region: 'Europe' },
  { code: 'GYD', city: 'Baku', country: 'Azerbaijan', region: 'Europe' },

  // ============================================================
  // EUROPE - Turkey
  // ============================================================
  { code: 'IST', city: 'Istanbul', country: 'Turkey', region: 'Europe' },
  { code: 'SAW', city: 'Istanbul Sabiha', country: 'Turkey', region: 'Europe' },
  { code: 'AYT', city: 'Antalya', country: 'Turkey', region: 'Europe' },
  { code: 'ESB', city: 'Ankara', country: 'Turkey', region: 'Europe' },
  { code: 'ADB', city: 'Izmir', country: 'Turkey', region: 'Europe' },
  { code: 'DLM', city: 'Dalaman', country: 'Turkey', region: 'Europe' },
  { code: 'BJV', city: 'Bodrum', country: 'Turkey', region: 'Europe' },
  { code: 'TZX', city: 'Trabzon', country: 'Turkey', region: 'Europe' },

  // ============================================================
  // EUROPE - Russia (European part)
  // ============================================================
  { code: 'SVO', city: 'Moscow Sheremetyevo', country: 'Russia', region: 'Europe' },
  { code: 'DME', city: 'Moscow Domodedovo', country: 'Russia', region: 'Europe' },
  { code: 'LED', city: 'St. Petersburg', country: 'Russia', region: 'Europe' },

  // ============================================================
  // ASIA - East Asia - Japan
  // ============================================================
  { code: 'NRT', city: 'Tokyo Narita', country: 'Japan', region: 'Asia' },
  { code: 'HND', city: 'Tokyo Haneda', country: 'Japan', region: 'Asia' },
  { code: 'KIX', city: 'Osaka', country: 'Japan', region: 'Asia' },
  { code: 'NGO', city: 'Nagoya', country: 'Japan', region: 'Asia' },
  { code: 'FUK', city: 'Fukuoka', country: 'Japan', region: 'Asia' },
  { code: 'CTS', city: 'Sapporo', country: 'Japan', region: 'Asia' },
  { code: 'OKA', city: 'Okinawa', country: 'Japan', region: 'Asia' },
  { code: 'KOJ', city: 'Kagoshima', country: 'Japan', region: 'Asia' },
  { code: 'HIJ', city: 'Hiroshima', country: 'Japan', region: 'Asia' },
  { code: 'SDJ', city: 'Sendai', country: 'Japan', region: 'Asia' },

  // ============================================================
  // ASIA - East Asia - South Korea
  // ============================================================
  { code: 'ICN', city: 'Seoul Incheon', country: 'South Korea', region: 'Asia' },
  { code: 'GMP', city: 'Seoul Gimpo', country: 'South Korea', region: 'Asia' },
  { code: 'PUS', city: 'Busan', country: 'South Korea', region: 'Asia' },
  { code: 'CJU', city: 'Jeju', country: 'South Korea', region: 'Asia' },

  // ============================================================
  // ASIA - East Asia - China
  // ============================================================
  { code: 'PEK', city: 'Beijing Capital', country: 'China', region: 'Asia' },
  { code: 'PKX', city: 'Beijing Daxing', country: 'China', region: 'Asia' },
  { code: 'PVG', city: 'Shanghai Pudong', country: 'China', region: 'Asia' },
  { code: 'SHA', city: 'Shanghai Hongqiao', country: 'China', region: 'Asia' },
  { code: 'CAN', city: 'Guangzhou', country: 'China', region: 'Asia' },
  { code: 'SZX', city: 'Shenzhen', country: 'China', region: 'Asia' },
  { code: 'CTU', city: 'Chengdu', country: 'China', region: 'Asia' },
  { code: 'XIY', city: 'Xi\'an', country: 'China', region: 'Asia' },
  { code: 'KMG', city: 'Kunming', country: 'China', region: 'Asia' },
  { code: 'CKG', city: 'Chongqing', country: 'China', region: 'Asia' },
  { code: 'WUH', city: 'Wuhan', country: 'China', region: 'Asia' },
  { code: 'HGH', city: 'Hangzhou', country: 'China', region: 'Asia' },
  { code: 'NKG', city: 'Nanjing', country: 'China', region: 'Asia' },
  { code: 'XMN', city: 'Xiamen', country: 'China', region: 'Asia' },
  { code: 'TAO', city: 'Qingdao', country: 'China', region: 'Asia' },
  { code: 'DLC', city: 'Dalian', country: 'China', region: 'Asia' },
  { code: 'SYX', city: 'Sanya', country: 'China', region: 'Asia' },
  { code: 'HAK', city: 'Haikou', country: 'China', region: 'Asia' },

  // ============================================================
  // ASIA - Hong Kong, Macau, Taiwan
  // ============================================================
  { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong', region: 'Asia' },
  { code: 'MFM', city: 'Macau', country: 'Macau', region: 'Asia' },
  { code: 'TPE', city: 'Taipei', country: 'Taiwan', region: 'Asia' },
  { code: 'KHH', city: 'Kaohsiung', country: 'Taiwan', region: 'Asia' },
  { code: 'RMQ', city: 'Taichung', country: 'Taiwan', region: 'Asia' },

  // ============================================================
  // ASIA - Mongolia
  // ============================================================
  { code: 'UBN', city: 'Ulaanbaatar', country: 'Mongolia', region: 'Asia' },

  // ============================================================
  // ASIA - Southeast Asia - Singapore
  // ============================================================
  { code: 'SIN', city: 'Singapore', country: 'Singapore', region: 'Asia' },

  // ============================================================
  // ASIA - Southeast Asia - Thailand
  // ============================================================
  { code: 'BKK', city: 'Bangkok Suvarnabhumi', country: 'Thailand', region: 'Asia' },
  { code: 'DMK', city: 'Bangkok Don Mueang', country: 'Thailand', region: 'Asia' },
  { code: 'CNX', city: 'Chiang Mai', country: 'Thailand', region: 'Asia' },
  { code: 'HKT', city: 'Phuket', country: 'Thailand', region: 'Asia' },
  { code: 'HDY', city: 'Hat Yai', country: 'Thailand', region: 'Asia' },
  { code: 'USM', city: 'Ko Samui', country: 'Thailand', region: 'Asia' },
  { code: 'KKC', city: 'Khon Kaen', country: 'Thailand', region: 'Asia' },
  { code: 'UTH', city: 'Udon Thani', country: 'Thailand', region: 'Asia' },
  { code: 'BFV', city: 'Buriram', country: 'Thailand', region: 'Asia' },
  { code: 'ROI', city: 'Roi Et', country: 'Thailand', region: 'Asia' },
  { code: 'NAK', city: 'Nakhon Ratchasima', country: 'Thailand', region: 'Asia' },
  { code: 'CEI', city: 'Chiang Rai', country: 'Thailand', region: 'Asia' },
  { code: 'URT', city: 'Surat Thani', country: 'Thailand', region: 'Asia' },
  { code: 'KBV', city: 'Krabi', country: 'Thailand', region: 'Asia' },

  // ============================================================
  // ASIA - Southeast Asia - Malaysia
  // ============================================================
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', region: 'Asia' },
  { code: 'PEN', city: 'Penang', country: 'Malaysia', region: 'Asia' },
  { code: 'JHB', city: 'Johor Bahru', country: 'Malaysia', region: 'Asia' },
  { code: 'KCH', city: 'Kuching', country: 'Malaysia', region: 'Asia' },
  { code: 'BKI', city: 'Kota Kinabalu', country: 'Malaysia', region: 'Asia' },
  { code: 'LGK', city: 'Langkawi', country: 'Malaysia', region: 'Asia' },

  // ============================================================
  // ASIA - Southeast Asia - Indonesia
  // ============================================================
  { code: 'CGK', city: 'Jakarta', country: 'Indonesia', region: 'Asia' },
  { code: 'DPS', city: 'Bali', country: 'Indonesia', region: 'Asia' },
  { code: 'SUB', city: 'Surabaya', country: 'Indonesia', region: 'Asia' },
  { code: 'UPG', city: 'Makassar', country: 'Indonesia', region: 'Asia' },
  { code: 'JOG', city: 'Yogyakarta', country: 'Indonesia', region: 'Asia' },
  { code: 'MDC', city: 'Manado', country: 'Indonesia', region: 'Asia' },
  { code: 'BPN', city: 'Balikpapan', country: 'Indonesia', region: 'Asia' },
  { code: 'PDG', city: 'Padang', country: 'Indonesia', region: 'Asia' },
  { code: 'LOP', city: 'Lombok', country: 'Indonesia', region: 'Asia' },

  // ============================================================
  // ASIA - Southeast Asia - Philippines
  // ============================================================
  { code: 'MNL', city: 'Manila', country: 'Philippines', region: 'Asia' },
  { code: 'CEB', city: 'Cebu', country: 'Philippines', region: 'Asia' },
  { code: 'DVO', city: 'Davao', country: 'Philippines', region: 'Asia' },
  { code: 'CRK', city: 'Clark', country: 'Philippines', region: 'Asia' },
  { code: 'ILO', city: 'Iloilo', country: 'Philippines', region: 'Asia' },
  { code: 'KLO', city: 'Kalibo Boracay', country: 'Philippines', region: 'Asia' },
  { code: 'PPS', city: 'Puerto Princesa', country: 'Philippines', region: 'Asia' },

  // ============================================================
  // ASIA - Southeast Asia - Vietnam
  // ============================================================
  { code: 'HAN', city: 'Hanoi', country: 'Vietnam', region: 'Asia' },
  { code: 'SGN', city: 'Ho Chi Minh City', country: 'Vietnam', region: 'Asia' },
  { code: 'DAD', city: 'Da Nang', country: 'Vietnam', region: 'Asia' },
  { code: 'CXR', city: 'Nha Trang', country: 'Vietnam', region: 'Asia' },
  { code: 'PQC', city: 'Phu Quoc', country: 'Vietnam', region: 'Asia' },
  { code: 'VDO', city: 'Van Don', country: 'Vietnam', region: 'Asia' },
  { code: 'DLI', city: 'Da Lat', country: 'Vietnam', region: 'Asia' },
  { code: 'HPH', city: 'Hai Phong', country: 'Vietnam', region: 'Asia' },

  // ============================================================
  // ASIA - Southeast Asia - Cambodia, Laos, Myanmar
  // ============================================================
  { code: 'PNH', city: 'Phnom Penh', country: 'Cambodia', region: 'Asia' },
  { code: 'REP', city: 'Siem Reap', country: 'Cambodia', region: 'Asia' },
  { code: 'VTE', city: 'Vientiane', country: 'Laos', region: 'Asia' },
  { code: 'LPQ', city: 'Luang Prabang', country: 'Laos', region: 'Asia' },
  { code: 'RGN', city: 'Yangon', country: 'Myanmar', region: 'Asia' },
  { code: 'MDL', city: 'Mandalay', country: 'Myanmar', region: 'Asia' },

  // ============================================================
  // ASIA - Southeast Asia - Brunei & Timor-Leste
  // ============================================================
  { code: 'BWN', city: 'Bandar Seri Begawan', country: 'Brunei', region: 'Asia' },
  { code: 'DIL', city: 'Dili', country: 'Timor-Leste', region: 'Asia' },

  // ============================================================
  // ASIA - South Asia - India
  // ============================================================
  { code: 'DEL', city: 'Delhi', country: 'India', region: 'Asia' },
  { code: 'BOM', city: 'Mumbai', country: 'India', region: 'Asia' },
  { code: 'BLR', city: 'Bangalore', country: 'India', region: 'Asia' },
  { code: 'HYD', city: 'Hyderabad', country: 'India', region: 'Asia' },
  { code: 'MAA', city: 'Chennai', country: 'India', region: 'Asia' },
  { code: 'CCU', city: 'Kolkata', country: 'India', region: 'Asia' },
  { code: 'GOI', city: 'Goa', country: 'India', region: 'Asia' },
  { code: 'COK', city: 'Kochi', country: 'India', region: 'Asia' },
  { code: 'AMD', city: 'Ahmedabad', country: 'India', region: 'Asia' },
  { code: 'PNQ', city: 'Pune', country: 'India', region: 'Asia' },
  { code: 'JAI', city: 'Jaipur', country: 'India', region: 'Asia' },
  { code: 'TRV', city: 'Thiruvananthapuram', country: 'India', region: 'Asia' },
  { code: 'GAU', city: 'Guwahati', country: 'India', region: 'Asia' },
  { code: 'LKO', city: 'Lucknow', country: 'India', region: 'Asia' },

  // ============================================================
  // ASIA - South Asia - Pakistan, Bangladesh, Sri Lanka, Nepal, Maldives, Bhutan
  // ============================================================
  { code: 'KHI', city: 'Karachi', country: 'Pakistan', region: 'Asia' },
  { code: 'LHE', city: 'Lahore', country: 'Pakistan', region: 'Asia' },
  { code: 'ISB', city: 'Islamabad', country: 'Pakistan', region: 'Asia' },
  { code: 'DAC', city: 'Dhaka', country: 'Bangladesh', region: 'Asia' },
  { code: 'CGP', city: 'Chittagong', country: 'Bangladesh', region: 'Asia' },
  { code: 'CMB', city: 'Colombo', country: 'Sri Lanka', region: 'Asia' },
  { code: 'HRI', city: 'Mattala', country: 'Sri Lanka', region: 'Asia' },
  { code: 'KTM', city: 'Kathmandu', country: 'Nepal', region: 'Asia' },
  { code: 'MLE', city: 'Male', country: 'Maldives', region: 'Asia' },
  { code: 'PBH', city: 'Paro', country: 'Bhutan', region: 'Asia' },

  // ============================================================
  // MIDDLE EAST
  // ============================================================
  // UAE
  { code: 'DXB', city: 'Dubai', country: 'UAE', region: 'Middle East' },
  { code: 'AUH', city: 'Abu Dhabi', country: 'UAE', region: 'Middle East' },
  { code: 'SHJ', city: 'Sharjah', country: 'UAE', region: 'Middle East' },
  { code: 'RKT', city: 'Ras Al Khaimah', country: 'UAE', region: 'Middle East' },
  // Qatar
  { code: 'DOH', city: 'Doha', country: 'Qatar', region: 'Middle East' },
  // Bahrain
  { code: 'BAH', city: 'Bahrain', country: 'Bahrain', region: 'Middle East' },
  // Kuwait
  { code: 'KWI', city: 'Kuwait City', country: 'Kuwait', region: 'Middle East' },
  // Oman
  { code: 'MCT', city: 'Muscat', country: 'Oman', region: 'Middle East' },
  { code: 'SLL', city: 'Salalah', country: 'Oman', region: 'Middle East' },
  // Saudi Arabia
  { code: 'RUH', city: 'Riyadh', country: 'Saudi Arabia', region: 'Middle East' },
  { code: 'JED', city: 'Jeddah', country: 'Saudi Arabia', region: 'Middle East' },
  { code: 'DMM', city: 'Dammam', country: 'Saudi Arabia', region: 'Middle East' },
  { code: 'MED', city: 'Medina', country: 'Saudi Arabia', region: 'Middle East' },
  // Jordan
  { code: 'AMM', city: 'Amman', country: 'Jordan', region: 'Middle East' },
  { code: 'AQJ', city: 'Aqaba', country: 'Jordan', region: 'Middle East' },
  // Israel
  { code: 'TLV', city: 'Tel Aviv', country: 'Israel', region: 'Middle East' },
  // Lebanon
  { code: 'BEY', city: 'Beirut', country: 'Lebanon', region: 'Middle East' },
  // Iraq
  { code: 'BGW', city: 'Baghdad', country: 'Iraq', region: 'Middle East' },
  { code: 'EBL', city: 'Erbil', country: 'Iraq', region: 'Middle East' },
  // Iran
  { code: 'IKA', city: 'Tehran', country: 'Iran', region: 'Middle East' },
  { code: 'MHD', city: 'Mashhad', country: 'Iran', region: 'Middle East' },
  { code: 'SYZ', city: 'Shiraz', country: 'Iran', region: 'Middle East' },
  { code: 'IFN', city: 'Isfahan', country: 'Iran', region: 'Middle East' },

  // ============================================================
  // AFRICA - North Africa
  // ============================================================
  { code: 'CAI', city: 'Cairo', country: 'Egypt', region: 'Africa' },
  { code: 'HRG', city: 'Hurghada', country: 'Egypt', region: 'Africa' },
  { code: 'SSH', city: 'Sharm El Sheikh', country: 'Egypt', region: 'Africa' },
  { code: 'LXR', city: 'Luxor', country: 'Egypt', region: 'Africa' },
  { code: 'ALG', city: 'Algiers', country: 'Algeria', region: 'Africa' },
  { code: 'ORN', city: 'Oran', country: 'Algeria', region: 'Africa' },
  { code: 'TUN', city: 'Tunis', country: 'Tunisia', region: 'Africa' },
  { code: 'CMN', city: 'Casablanca', country: 'Morocco', region: 'Africa' },
  { code: 'RAK', city: 'Marrakech', country: 'Morocco', region: 'Africa' },
  { code: 'FEZ', city: 'Fez', country: 'Morocco', region: 'Africa' },
  { code: 'TNG', city: 'Tangier', country: 'Morocco', region: 'Africa' },
  { code: 'AGA', city: 'Agadir', country: 'Morocco', region: 'Africa' },

  // ============================================================
  // AFRICA - West Africa
  // ============================================================
  { code: 'LOS', city: 'Lagos', country: 'Nigeria', region: 'Africa' },
  { code: 'ABV', city: 'Abuja', country: 'Nigeria', region: 'Africa' },
  { code: 'ACC', city: 'Accra', country: 'Ghana', region: 'Africa' },
  { code: 'ABJ', city: 'Abidjan', country: 'Ivory Coast', region: 'Africa' },
  { code: 'DSS', city: 'Dakar', country: 'Senegal', region: 'Africa' },

  // ============================================================
  // AFRICA - East Africa
  // ============================================================
  { code: 'NBO', city: 'Nairobi', country: 'Kenya', region: 'Africa' },
  { code: 'MBA', city: 'Mombasa', country: 'Kenya', region: 'Africa' },
  { code: 'DAR', city: 'Dar es Salaam', country: 'Tanzania', region: 'Africa' },
  { code: 'JRO', city: 'Kilimanjaro', country: 'Tanzania', region: 'Africa' },
  { code: 'ZNZ', city: 'Zanzibar', country: 'Tanzania', region: 'Africa' },
  { code: 'ADD', city: 'Addis Ababa', country: 'Ethiopia', region: 'Africa' },
  { code: 'EBB', city: 'Entebbe', country: 'Uganda', region: 'Africa' },
  { code: 'KGL', city: 'Kigali', country: 'Rwanda', region: 'Africa' },

  // ============================================================
  // AFRICA - Southern Africa
  // ============================================================
  { code: 'JNB', city: 'Johannesburg', country: 'South Africa', region: 'Africa' },
  { code: 'CPT', city: 'Cape Town', country: 'South Africa', region: 'Africa' },
  { code: 'DUR', city: 'Durban', country: 'South Africa', region: 'Africa' },
  { code: 'WDH', city: 'Windhoek', country: 'Namibia', region: 'Africa' },
  { code: 'VFA', city: 'Victoria Falls', country: 'Zimbabwe', region: 'Africa' },
  { code: 'HRE', city: 'Harare', country: 'Zimbabwe', region: 'Africa' },
  { code: 'LLW', city: 'Lilongwe', country: 'Malawi', region: 'Africa' },
  { code: 'LUN', city: 'Lusaka', country: 'Zambia', region: 'Africa' },
  { code: 'GBE', city: 'Gaborone', country: 'Botswana', region: 'Africa' },
  { code: 'MPM', city: 'Maputo', country: 'Mozambique', region: 'Africa' },

  // ============================================================
  // AFRICA - Indian Ocean Islands
  // ============================================================
  { code: 'MRU', city: 'Mauritius', country: 'Mauritius', region: 'Africa' },
  { code: 'RUN', city: 'Reunion', country: 'Reunion', region: 'Africa' },
  { code: 'SEZ', city: 'Mahe', country: 'Seychelles', region: 'Africa' },
  { code: 'TNR', city: 'Antananarivo', country: 'Madagascar', region: 'Africa' },
  { code: 'NOS', city: 'Nosy Be', country: 'Madagascar', region: 'Africa' },

  // ============================================================
  // OCEANIA - Australia
  // ============================================================
  { code: 'SYD', city: 'Sydney', country: 'Australia', region: 'Oceania' },
  { code: 'MEL', city: 'Melbourne', country: 'Australia', region: 'Oceania' },
  { code: 'BNE', city: 'Brisbane', country: 'Australia', region: 'Oceania' },
  { code: 'PER', city: 'Perth', country: 'Australia', region: 'Oceania' },
  { code: 'ADL', city: 'Adelaide', country: 'Australia', region: 'Oceania' },
  { code: 'OOL', city: 'Gold Coast', country: 'Australia', region: 'Oceania' },
  { code: 'CBR', city: 'Canberra', country: 'Australia', region: 'Oceania' },
  { code: 'CNS', city: 'Cairns', country: 'Australia', region: 'Oceania' },
  { code: 'DRW', city: 'Darwin', country: 'Australia', region: 'Oceania' },
  { code: 'HBA', city: 'Hobart', country: 'Australia', region: 'Oceania' },

  // ============================================================
  // OCEANIA - New Zealand
  // ============================================================
  { code: 'AKL', city: 'Auckland', country: 'New Zealand', region: 'Oceania' },
  { code: 'CHC', city: 'Christchurch', country: 'New Zealand', region: 'Oceania' },
  { code: 'WLG', city: 'Wellington', country: 'New Zealand', region: 'Oceania' },
  { code: 'ZQN', city: 'Queenstown', country: 'New Zealand', region: 'Oceania' },

  // ============================================================
  // OCEANIA - Pacific Islands
  // ============================================================
  { code: 'NAN', city: 'Nadi', country: 'Fiji', region: 'Oceania' },
  { code: 'SUV', city: 'Suva', country: 'Fiji', region: 'Oceania' },
  { code: 'PPT', city: 'Papeete Tahiti', country: 'French Polynesia', region: 'Oceania' },
  { code: 'NOU', city: 'Noumea', country: 'New Caledonia', region: 'Oceania' },
  { code: 'APW', city: 'Apia', country: 'Samoa', region: 'Oceania' },
  { code: 'TBU', city: 'Nuku\'alofa', country: 'Tonga', region: 'Oceania' },
  { code: 'VLI', city: 'Port Vila', country: 'Vanuatu', region: 'Oceania' },
  { code: 'POM', city: 'Port Moresby', country: 'Papua New Guinea', region: 'Oceania' },
  { code: 'GUM', city: 'Guam', country: 'Guam', region: 'Oceania' },
  { code: 'ROR', city: 'Palau', country: 'Palau', region: 'Oceania' },

  // ============================================================
  // SOUTH AMERICA
  // ============================================================
  // Brazil
  { code: 'GRU', city: 'Sao Paulo Guarulhos', country: 'Brazil', region: 'South America' },
  { code: 'CGH', city: 'Sao Paulo Congonhas', country: 'Brazil', region: 'South America' },
  { code: 'GIG', city: 'Rio de Janeiro', country: 'Brazil', region: 'South America' },
  { code: 'BSB', city: 'Brasilia', country: 'Brazil', region: 'South America' },
  { code: 'SSA', city: 'Salvador', country: 'Brazil', region: 'South America' },
  { code: 'REC', city: 'Recife', country: 'Brazil', region: 'South America' },
  { code: 'FOR', city: 'Fortaleza', country: 'Brazil', region: 'South America' },
  { code: 'CWB', city: 'Curitiba', country: 'Brazil', region: 'South America' },
  { code: 'BEL', city: 'Belem', country: 'Brazil', region: 'South America' },
  { code: 'POA', city: 'Porto Alegre', country: 'Brazil', region: 'South America' },
  { code: 'FLN', city: 'Florianopolis', country: 'Brazil', region: 'South America' },
  // Argentina
  { code: 'EZE', city: 'Buenos Aires Ezeiza', country: 'Argentina', region: 'South America' },
  { code: 'AEP', city: 'Buenos Aires Aeroparque', country: 'Argentina', region: 'South America' },
  { code: 'COR', city: 'Cordoba', country: 'Argentina', region: 'South America' },
  { code: 'MDZ', city: 'Mendoza', country: 'Argentina', region: 'South America' },
  { code: 'BRC', city: 'Bariloche', country: 'Argentina', region: 'South America' },
  { code: 'USH', city: 'Ushuaia', country: 'Argentina', region: 'South America' },
  // Chile
  { code: 'SCL', city: 'Santiago', country: 'Chile', region: 'South America' },
  { code: 'IPC', city: 'Easter Island', country: 'Chile', region: 'South America' },
  // Peru
  { code: 'LIM', city: 'Lima', country: 'Peru', region: 'South America' },
  { code: 'CUZ', city: 'Cusco', country: 'Peru', region: 'South America' },
  // Colombia
  { code: 'BOG', city: 'Bogota', country: 'Colombia', region: 'South America' },
  { code: 'MDE', city: 'Medellin', country: 'Colombia', region: 'South America' },
  { code: 'CTG', city: 'Cartagena', country: 'Colombia', region: 'South America' },
  { code: 'CLO', city: 'Cali', country: 'Colombia', region: 'South America' },
  // Ecuador
  { code: 'UIO', city: 'Quito', country: 'Ecuador', region: 'South America' },
  { code: 'GYE', city: 'Guayaquil', country: 'Ecuador', region: 'South America' },
  { code: 'GPS', city: 'Galapagos', country: 'Ecuador', region: 'South America' },
  // Venezuela
  { code: 'CCS', city: 'Caracas', country: 'Venezuela', region: 'South America' },
  // Bolivia
  { code: 'LPB', city: 'La Paz', country: 'Bolivia', region: 'South America' },
  { code: 'VVI', city: 'Santa Cruz', country: 'Bolivia', region: 'South America' },
  // Paraguay
  { code: 'ASU', city: 'Asuncion', country: 'Paraguay', region: 'South America' },
  // Uruguay
  { code: 'MVD', city: 'Montevideo', country: 'Uruguay', region: 'South America' },
  // Guyana & Suriname
  { code: 'GEO', city: 'Georgetown', country: 'Guyana', region: 'South America' },
  { code: 'PBM', city: 'Paramaribo', country: 'Suriname', region: 'South America' },

  // ============================================================
  // CENTRAL AMERICA & CARIBBEAN
  // ============================================================
  // Central America
  { code: 'PTY', city: 'Panama City', country: 'Panama', region: 'Central America' },
  { code: 'SJO', city: 'San Jose', country: 'Costa Rica', region: 'Central America' },
  { code: 'LIR', city: 'Liberia', country: 'Costa Rica', region: 'Central America' },
  { code: 'GUA', city: 'Guatemala City', country: 'Guatemala', region: 'Central America' },
  { code: 'SAL', city: 'San Salvador', country: 'El Salvador', region: 'Central America' },
  { code: 'TGU', city: 'Tegucigalpa', country: 'Honduras', region: 'Central America' },
  { code: 'RTB', city: 'Roatan', country: 'Honduras', region: 'Central America' },
  { code: 'MGA', city: 'Managua', country: 'Nicaragua', region: 'Central America' },
  { code: 'BZE', city: 'Belize City', country: 'Belize', region: 'Central America' },
  // Caribbean
  { code: 'SJU', city: 'San Juan', country: 'Puerto Rico', region: 'Caribbean' },
  { code: 'NAS', city: 'Nassau', country: 'Bahamas', region: 'Caribbean' },
  { code: 'MBJ', city: 'Montego Bay', country: 'Jamaica', region: 'Caribbean' },
  { code: 'KIN', city: 'Kingston', country: 'Jamaica', region: 'Caribbean' },
  { code: 'PUJ', city: 'Punta Cana', country: 'Dominican Republic', region: 'Caribbean' },
  { code: 'SDQ', city: 'Santo Domingo', country: 'Dominican Republic', region: 'Caribbean' },
  { code: 'HAV', city: 'Havana', country: 'Cuba', region: 'Caribbean' },
  { code: 'VRA', city: 'Varadero', country: 'Cuba', region: 'Caribbean' },
  { code: 'AUA', city: 'Aruba', country: 'Aruba', region: 'Caribbean' },
  { code: 'CUR', city: 'Curacao', country: 'Curacao', region: 'Caribbean' },
  { code: 'SXM', city: 'St. Maarten', country: 'Sint Maarten', region: 'Caribbean' },
  { code: 'BGI', city: 'Barbados', country: 'Barbados', region: 'Caribbean' },
  { code: 'POS', city: 'Port of Spain', country: 'Trinidad and Tobago', region: 'Caribbean' },
  { code: 'GND', city: 'Grenada', country: 'Grenada', region: 'Caribbean' },
  { code: 'UVF', city: 'St. Lucia', country: 'Saint Lucia', region: 'Caribbean' },
  { code: 'ANU', city: 'Antigua', country: 'Antigua and Barbuda', region: 'Caribbean' },
  { code: 'GCM', city: 'Grand Cayman', country: 'Cayman Islands', region: 'Caribbean' },
  { code: 'BDA', city: 'Bermuda', country: 'Bermuda', region: 'Caribbean' },
  { code: 'STT', city: 'St. Thomas', country: 'US Virgin Islands', region: 'Caribbean' },
  { code: 'PTP', city: 'Pointe-a-Pitre', country: 'Guadeloupe', region: 'Caribbean' },
  { code: 'FDF', city: 'Fort-de-France', country: 'Martinique', region: 'Caribbean' },

  // ============================================================
  // CENTRAL ASIA
  // ============================================================
  { code: 'ALA', city: 'Almaty', country: 'Kazakhstan', region: 'Central Asia' },
  { code: 'NQZ', city: 'Astana', country: 'Kazakhstan', region: 'Central Asia' },
  { code: 'TAS', city: 'Tashkent', country: 'Uzbekistan', region: 'Central Asia' },
  { code: 'SKD', city: 'Samarkand', country: 'Uzbekistan', region: 'Central Asia' },
]

/**
 * Build country groups dynamically from the airport list.
 * Only countries with 2+ airports get a group entry.
 */
function buildCountryGroups(): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const airport of majorAirports) {
    if (!groups[airport.country]) {
      groups[airport.country] = []
    }
    groups[airport.country].push(airport.code)
  }
  // Remove countries with only 1 airport
  for (const country of Object.keys(groups)) {
    if (groups[country].length < 2) {
      delete groups[country]
    }
  }
  return groups
}

/**
 * Build city groups dynamically from the airport list.
 * Normalizes city names to group airports in the same city (e.g., "London Heathrow" and "London Gatwick" both contain "London").
 * Only cities with 2+ airports get a group entry.
 */
function buildCityGroups(): Record<string, { codes: string[]; country: string }> {
  // Define known multi-airport city prefixes with their display names
  const cityPrefixes: Record<string, string> = {
    'london': 'London',
    'new york': 'New York',
    'tokyo': 'Tokyo',
    'paris': 'Paris',
    'moscow': 'Moscow',
    'istanbul': 'Istanbul',
    'seoul': 'Seoul',
    'beijing': 'Beijing',
    'shanghai': 'Shanghai',
    'houston': 'Houston',
    'chicago': 'Chicago',
    'washington': 'Washington DC',
    'buenos aires': 'Buenos Aires',
    'sao paulo': 'Sao Paulo',
    'bangkok': 'Bangkok',
    'milan': 'Milan',
    'brussels': 'Brussels',
  }

  const groups: Record<string, { codes: string[]; country: string }> = {}

  for (const [prefix, displayName] of Object.entries(cityPrefixes)) {
    const matching = majorAirports.filter(a =>
      a.city.toLowerCase().startsWith(prefix)
    )
    if (matching.length >= 2) {
      groups[displayName] = {
        codes: matching.map(a => a.code),
        country: matching[0].country,
      }
    }
  }

  return groups
}

const countryGroups = buildCountryGroups()
const cityGroups = buildCityGroups()

/**
 * Get airport code from city name
 */
export function getAirportCodeFromCity(city: string): string | null {
  const normalizedCity = city.toLowerCase().trim()
  const found = majorAirports.find(
    airport => airport.city.toLowerCase() === normalizedCity
  )
  return found?.code || null
}

/**
 * Find the nearest airport to given coordinates using haversine distance
 */
function findNearestAirport(lat: number, lon: number): { code: string; city: string } | null {
  // Airport coordinates (approximate) for major airports
  const airportCoords: Record<string, { lat: number; lon: number }> = {
    BKK: { lat: 13.69, lon: 100.75 }, SIN: { lat: 1.35, lon: 103.99 },
    KUL: { lat: 2.74, lon: 101.70 }, CGK: { lat: -6.13, lon: 106.66 },
    MNL: { lat: 14.51, lon: 121.02 }, HKG: { lat: 22.31, lon: 113.92 },
    NRT: { lat: 35.76, lon: 140.39 }, ICN: { lat: 37.46, lon: 126.44 },
    PVG: { lat: 31.14, lon: 121.81 }, DEL: { lat: 28.56, lon: 77.10 },
    BOM: { lat: 19.09, lon: 72.87 }, DXB: { lat: 25.25, lon: 55.36 },
    DOH: { lat: 25.26, lon: 51.57 }, IST: { lat: 41.26, lon: 28.74 },
    LHR: { lat: 51.47, lon: -0.46 }, CDG: { lat: 49.01, lon: 2.55 },
    AMS: { lat: 52.31, lon: 4.77 }, FRA: { lat: 50.03, lon: 8.57 },
    FCO: { lat: 41.80, lon: 12.25 }, BCN: { lat: 41.30, lon: 2.08 },
    MAD: { lat: 40.47, lon: -3.56 }, LIS: { lat: 38.77, lon: -9.13 },
    JFK: { lat: 40.64, lon: -73.78 }, LAX: { lat: 33.94, lon: -118.41 },
    ORD: { lat: 41.97, lon: -87.91 }, MIA: { lat: 25.80, lon: -80.29 },
    SFO: { lat: 37.62, lon: -122.38 }, ATL: { lat: 33.64, lon: -84.43 },
    SYD: { lat: -33.95, lon: 151.18 }, MEL: { lat: -37.67, lon: 144.84 },
    GRU: { lat: -23.43, lon: -46.47 }, HAN: { lat: 21.22, lon: 105.81 },
    SGN: { lat: 10.82, lon: 106.65 }, HKT: { lat: 8.11, lon: 98.32 },
    CNX: { lat: 18.77, lon: 98.96 }, DPS: { lat: -8.75, lon: 115.17 },
    TPE: { lat: 25.08, lon: 121.23 }, CMB: { lat: 7.18, lon: 79.88 },
    CAI: { lat: 30.12, lon: 31.41 }, NBO: { lat: -1.32, lon: 36.93 },
    CPT: { lat: -33.96, lon: 18.60 }, YYZ: { lat: 43.68, lon: -79.63 },
    SEA: { lat: 47.45, lon: -122.31 }, DEN: { lat: 39.86, lon: -104.67 },
    LCA: { lat: 34.88, lon: 33.63 }, PFO: { lat: 34.72, lon: 32.49 },
    MLE: { lat: 4.19, lon: 73.53 }, MRU: { lat: -20.43, lon: 57.68 },
    NAN: { lat: -17.76, lon: 177.44 }, SEZ: { lat: -4.67, lon: 55.52 },
    RUH: { lat: 24.96, lon: 46.70 }, JED: { lat: 21.67, lon: 39.16 },
    BOG: { lat: 4.70, lon: -74.15 }, LIM: { lat: -12.02, lon: -77.11 },
    SCL: { lat: -33.39, lon: -70.79 }, EZE: { lat: -34.82, lon: -58.54 },
  }

  const toRad = (deg: number) => deg * Math.PI / 180
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  let nearest: { code: string; dist: number } | null = null
  for (const [code, coords] of Object.entries(airportCoords)) {
    const dist = haversine(lat, lon, coords.lat, coords.lon)
    if (!nearest || dist < nearest.dist) {
      nearest = { code, dist }
    }
  }

  if (!nearest) return null
  const airport = majorAirports.find(a => a.code === nearest!.code)
  return airport ? { code: airport.code, city: airport.city } : null
}

const SESSION_KEY = 'globepilot_user_location'

/**
 * Get user's approximate location using browser geolocation API
 * Finds nearest airport by lat/lon, caches in sessionStorage
 * Defaults to BKK (primary audience is SE Asia based)
 */
export async function getUserLocation(): Promise<GeolocationResult | null> {
  if (typeof window === 'undefined') {
    return { city: 'Bangkok Suvarnabhumi', airportCode: 'BKK' }
  }

  // Check sessionStorage cache
  try {
    const cached = sessionStorage.getItem(SESSION_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch {}

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { city: 'Bangkok Suvarnabhumi', airportCode: 'BKK' }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const nearest = findNearestAirport(position.coords.latitude, position.coords.longitude)
          const result: GeolocationResult = nearest
            ? { city: nearest.city, airportCode: nearest.code }
            : { city: 'Bangkok Suvarnabhumi', airportCode: 'BKK' }

          // Cache in sessionStorage
          try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(result)) } catch {}

          resolve(result)
        } catch {
          resolve({ city: 'Bangkok Suvarnabhumi', airportCode: 'BKK' })
        }
      },
      () => {
        // Geolocation denied or unavailable — default to BKK
        const result = { city: 'Bangkok Suvarnabhumi', airportCode: 'BKK' }
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(result)) } catch {}
        resolve(result)
      },
      {
        timeout: 5000,
        maximumAge: 3600000,
      }
    )
  })
}

/**
 * Get airports by region
 */
export function getAirportsByRegion(region: string) {
  return majorAirports.filter(airport => airport.region === region)
}

/**
 * Get all unique regions
 */
export function getAllRegions() {
  const regions = [...new Set(majorAirports.map(airport => airport.region))]
  return regions.sort()
}

/**
 * Search airports by city name, country, or IATA code.
 * Also returns "group" entries for countries and cities with multiple airports.
 *
 * Group entries have:
 *  - code: comma-separated IATA codes (e.g. "LCA,PFO")
 *  - city: "Cyprus (All airports)" or "London (All airports)"
 *  - country: the country name
 */
export function searchAirports(query: string) {
  const normalized = query.toLowerCase().trim()
  if (!normalized) return []

  const individualResults = majorAirports.filter(airport =>
    airport.city.toLowerCase().includes(normalized) ||
    airport.country.toLowerCase().includes(normalized) ||
    airport.code.toLowerCase().includes(normalized)
  )

  // Build group entries to prepend
  const groupEntries: { code: string; city: string; country: string; region?: string }[] = []

  // Check country groups — match if query is a substring of the country name
  for (const [country, codes] of Object.entries(countryGroups)) {
    if (country.toLowerCase().includes(normalized)) {
      groupEntries.push({
        code: codes.join(','),
        city: `${country} (All airports)`,
        country: country,
      })
    }
  }

  // Check city groups — match if query is a substring of the city display name
  for (const [cityName, { codes, country }] of Object.entries(cityGroups)) {
    if (cityName.toLowerCase().includes(normalized)) {
      groupEntries.push({
        code: codes.join(','),
        city: `${cityName} (All airports)`,
        country: country,
      })
    }
  }

  // Deduplicate: don't include group entries whose codes already appear
  // as a single individual result (no value in grouping 1 result)
  // This is already handled by buildCountryGroups/buildCityGroups requiring 2+

  return [...groupEntries, ...individualResults]
}

/**
 * Look up an airport or group entry by code (supports comma-separated group codes).
 * Returns the display info for use in the autocomplete component.
 */
export function lookupAirportByCode(code: string): { city: string; country: string } | null {
  // Single airport code
  if (!code.includes(',')) {
    const airport = majorAirports.find(a => a.code === code)
    return airport ? { city: airport.city, country: airport.country } : null
  }

  // Group code — check country groups first
  for (const [country, codes] of Object.entries(countryGroups)) {
    if (codes.join(',') === code) {
      return { city: `${country} (All airports)`, country }
    }
  }

  // Check city groups
  for (const [cityName, { codes, country }] of Object.entries(cityGroups)) {
    if (codes.join(',') === code) {
      return { city: `${cityName} (All airports)`, country }
    }
  }

  return null
}
