// All ~195 countries with ISO 3166-1 alpha-2 codes and flag emojis
// Used by the PassportSelector component across mystery trip planner and stopover finder

export interface Passport {
  code: string    // ISO 3166-1 alpha-2 (US, GB, AU, etc.)
  name: string    // Full country name
  flag: string    // Flag emoji
}

export const ALL_PASSPORTS: Passport[] = [
  // A
  { code: 'AF', name: 'Afghanistan', flag: '\u{1F1E6}\u{1F1EB}' },
  { code: 'AL', name: 'Albania', flag: '\u{1F1E6}\u{1F1F1}' },
  { code: 'DZ', name: 'Algeria', flag: '\u{1F1E9}\u{1F1FF}' },
  { code: 'AD', name: 'Andorra', flag: '\u{1F1E6}\u{1F1E9}' },
  { code: 'AO', name: 'Angola', flag: '\u{1F1E6}\u{1F1F4}' },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '\u{1F1E6}\u{1F1EC}' },
  { code: 'AR', name: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}' },
  { code: 'AM', name: 'Armenia', flag: '\u{1F1E6}\u{1F1F2}' },
  { code: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: 'AT', name: 'Austria', flag: '\u{1F1E6}\u{1F1F9}' },
  { code: 'AZ', name: 'Azerbaijan', flag: '\u{1F1E6}\u{1F1FF}' },
  // B
  { code: 'BS', name: 'Bahamas', flag: '\u{1F1E7}\u{1F1F8}' },
  { code: 'BH', name: 'Bahrain', flag: '\u{1F1E7}\u{1F1ED}' },
  { code: 'BD', name: 'Bangladesh', flag: '\u{1F1E7}\u{1F1E9}' },
  { code: 'BB', name: 'Barbados', flag: '\u{1F1E7}\u{1F1E7}' },
  { code: 'BY', name: 'Belarus', flag: '\u{1F1E7}\u{1F1FE}' },
  { code: 'BE', name: 'Belgium', flag: '\u{1F1E7}\u{1F1EA}' },
  { code: 'BZ', name: 'Belize', flag: '\u{1F1E7}\u{1F1FF}' },
  { code: 'BJ', name: 'Benin', flag: '\u{1F1E7}\u{1F1EF}' },
  { code: 'BT', name: 'Bhutan', flag: '\u{1F1E7}\u{1F1F9}' },
  { code: 'BO', name: 'Bolivia', flag: '\u{1F1E7}\u{1F1F4}' },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '\u{1F1E7}\u{1F1E6}' },
  { code: 'BW', name: 'Botswana', flag: '\u{1F1E7}\u{1F1FC}' },
  { code: 'BR', name: 'Brazil', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'BN', name: 'Brunei', flag: '\u{1F1E7}\u{1F1F3}' },
  { code: 'BG', name: 'Bulgaria', flag: '\u{1F1E7}\u{1F1EC}' },
  { code: 'BF', name: 'Burkina Faso', flag: '\u{1F1E7}\u{1F1EB}' },
  { code: 'BI', name: 'Burundi', flag: '\u{1F1E7}\u{1F1EE}' },
  // C
  { code: 'KH', name: 'Cambodia', flag: '\u{1F1F0}\u{1F1ED}' },
  { code: 'CM', name: 'Cameroon', flag: '\u{1F1E8}\u{1F1F2}' },
  { code: 'CA', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
  { code: 'CV', name: 'Cape Verde', flag: '\u{1F1E8}\u{1F1FB}' },
  { code: 'CF', name: 'Central African Republic', flag: '\u{1F1E8}\u{1F1EB}' },
  { code: 'TD', name: 'Chad', flag: '\u{1F1F9}\u{1F1E9}' },
  { code: 'CL', name: 'Chile', flag: '\u{1F1E8}\u{1F1F1}' },
  { code: 'CN', name: 'China', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'CO', name: 'Colombia', flag: '\u{1F1E8}\u{1F1F4}' },
  { code: 'KM', name: 'Comoros', flag: '\u{1F1F0}\u{1F1F2}' },
  { code: 'CG', name: 'Congo', flag: '\u{1F1E8}\u{1F1EC}' },
  { code: 'CD', name: 'Congo (DRC)', flag: '\u{1F1E8}\u{1F1E9}' },
  { code: 'CR', name: 'Costa Rica', flag: '\u{1F1E8}\u{1F1F7}' },
  { code: 'CI', name: "Cote d'Ivoire", flag: '\u{1F1E8}\u{1F1EE}' },
  { code: 'HR', name: 'Croatia', flag: '\u{1F1ED}\u{1F1F7}' },
  { code: 'CU', name: 'Cuba', flag: '\u{1F1E8}\u{1F1FA}' },
  { code: 'CY', name: 'Cyprus', flag: '\u{1F1E8}\u{1F1FE}' },
  { code: 'CZ', name: 'Czech Republic', flag: '\u{1F1E8}\u{1F1FF}' },
  // D
  { code: 'DK', name: 'Denmark', flag: '\u{1F1E9}\u{1F1F0}' },
  { code: 'DJ', name: 'Djibouti', flag: '\u{1F1E9}\u{1F1EF}' },
  { code: 'DM', name: 'Dominica', flag: '\u{1F1E9}\u{1F1F2}' },
  { code: 'DO', name: 'Dominican Republic', flag: '\u{1F1E9}\u{1F1F4}' },
  // E
  { code: 'EC', name: 'Ecuador', flag: '\u{1F1EA}\u{1F1E8}' },
  { code: 'EG', name: 'Egypt', flag: '\u{1F1EA}\u{1F1EC}' },
  { code: 'SV', name: 'El Salvador', flag: '\u{1F1F8}\u{1F1FB}' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '\u{1F1EC}\u{1F1F6}' },
  { code: 'ER', name: 'Eritrea', flag: '\u{1F1EA}\u{1F1F7}' },
  { code: 'EE', name: 'Estonia', flag: '\u{1F1EA}\u{1F1EA}' },
  { code: 'SZ', name: 'Eswatini', flag: '\u{1F1F8}\u{1F1FF}' },
  { code: 'ET', name: 'Ethiopia', flag: '\u{1F1EA}\u{1F1F9}' },
  // F
  { code: 'FJ', name: 'Fiji', flag: '\u{1F1EB}\u{1F1EF}' },
  { code: 'FI', name: 'Finland', flag: '\u{1F1EB}\u{1F1EE}' },
  { code: 'FR', name: 'France', flag: '\u{1F1EB}\u{1F1F7}' },
  // G
  { code: 'GA', name: 'Gabon', flag: '\u{1F1EC}\u{1F1E6}' },
  { code: 'GM', name: 'Gambia', flag: '\u{1F1EC}\u{1F1F2}' },
  { code: 'GE', name: 'Georgia', flag: '\u{1F1EC}\u{1F1EA}' },
  { code: 'DE', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'GH', name: 'Ghana', flag: '\u{1F1EC}\u{1F1ED}' },
  { code: 'GR', name: 'Greece', flag: '\u{1F1EC}\u{1F1F7}' },
  { code: 'GD', name: 'Grenada', flag: '\u{1F1EC}\u{1F1E9}' },
  { code: 'GT', name: 'Guatemala', flag: '\u{1F1EC}\u{1F1F9}' },
  { code: 'GN', name: 'Guinea', flag: '\u{1F1EC}\u{1F1F3}' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '\u{1F1EC}\u{1F1FC}' },
  { code: 'GY', name: 'Guyana', flag: '\u{1F1EC}\u{1F1FE}' },
  // H
  { code: 'HT', name: 'Haiti', flag: '\u{1F1ED}\u{1F1F9}' },
  { code: 'HN', name: 'Honduras', flag: '\u{1F1ED}\u{1F1F3}' },
  { code: 'HU', name: 'Hungary', flag: '\u{1F1ED}\u{1F1FA}' },
  // I
  { code: 'IS', name: 'Iceland', flag: '\u{1F1EE}\u{1F1F8}' },
  { code: 'IN', name: 'India', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'ID', name: 'Indonesia', flag: '\u{1F1EE}\u{1F1E9}' },
  { code: 'IR', name: 'Iran', flag: '\u{1F1EE}\u{1F1F7}' },
  { code: 'IQ', name: 'Iraq', flag: '\u{1F1EE}\u{1F1F6}' },
  { code: 'IE', name: 'Ireland', flag: '\u{1F1EE}\u{1F1EA}' },
  { code: 'IL', name: 'Israel', flag: '\u{1F1EE}\u{1F1F1}' },
  { code: 'IT', name: 'Italy', flag: '\u{1F1EE}\u{1F1F9}' },
  // J
  { code: 'JM', name: 'Jamaica', flag: '\u{1F1EF}\u{1F1F2}' },
  { code: 'JP', name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'JO', name: 'Jordan', flag: '\u{1F1EF}\u{1F1F4}' },
  // K
  { code: 'KZ', name: 'Kazakhstan', flag: '\u{1F1F0}\u{1F1FF}' },
  { code: 'KE', name: 'Kenya', flag: '\u{1F1F0}\u{1F1EA}' },
  { code: 'KI', name: 'Kiribati', flag: '\u{1F1F0}\u{1F1EE}' },
  { code: 'KP', name: 'North Korea', flag: '\u{1F1F0}\u{1F1F5}' },
  { code: 'KR', name: 'South Korea', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'KW', name: 'Kuwait', flag: '\u{1F1F0}\u{1F1FC}' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '\u{1F1F0}\u{1F1EC}' },
  // L
  { code: 'LA', name: 'Laos', flag: '\u{1F1F1}\u{1F1E6}' },
  { code: 'LV', name: 'Latvia', flag: '\u{1F1F1}\u{1F1FB}' },
  { code: 'LB', name: 'Lebanon', flag: '\u{1F1F1}\u{1F1E7}' },
  { code: 'LS', name: 'Lesotho', flag: '\u{1F1F1}\u{1F1F8}' },
  { code: 'LR', name: 'Liberia', flag: '\u{1F1F1}\u{1F1F7}' },
  { code: 'LY', name: 'Libya', flag: '\u{1F1F1}\u{1F1FE}' },
  { code: 'LI', name: 'Liechtenstein', flag: '\u{1F1F1}\u{1F1EE}' },
  { code: 'LT', name: 'Lithuania', flag: '\u{1F1F1}\u{1F1F9}' },
  { code: 'LU', name: 'Luxembourg', flag: '\u{1F1F1}\u{1F1FA}' },
  // M
  { code: 'MG', name: 'Madagascar', flag: '\u{1F1F2}\u{1F1EC}' },
  { code: 'MW', name: 'Malawi', flag: '\u{1F1F2}\u{1F1FC}' },
  { code: 'MY', name: 'Malaysia', flag: '\u{1F1F2}\u{1F1FE}' },
  { code: 'MV', name: 'Maldives', flag: '\u{1F1F2}\u{1F1FB}' },
  { code: 'ML', name: 'Mali', flag: '\u{1F1F2}\u{1F1F1}' },
  { code: 'MT', name: 'Malta', flag: '\u{1F1F2}\u{1F1F9}' },
  { code: 'MH', name: 'Marshall Islands', flag: '\u{1F1F2}\u{1F1ED}' },
  { code: 'MR', name: 'Mauritania', flag: '\u{1F1F2}\u{1F1F7}' },
  { code: 'MU', name: 'Mauritius', flag: '\u{1F1F2}\u{1F1FA}' },
  { code: 'MX', name: 'Mexico', flag: '\u{1F1F2}\u{1F1FD}' },
  { code: 'FM', name: 'Micronesia', flag: '\u{1F1EB}\u{1F1F2}' },
  { code: 'MD', name: 'Moldova', flag: '\u{1F1F2}\u{1F1E9}' },
  { code: 'MC', name: 'Monaco', flag: '\u{1F1F2}\u{1F1E8}' },
  { code: 'MN', name: 'Mongolia', flag: '\u{1F1F2}\u{1F1F3}' },
  { code: 'ME', name: 'Montenegro', flag: '\u{1F1F2}\u{1F1EA}' },
  { code: 'MA', name: 'Morocco', flag: '\u{1F1F2}\u{1F1E6}' },
  { code: 'MZ', name: 'Mozambique', flag: '\u{1F1F2}\u{1F1FF}' },
  { code: 'MM', name: 'Myanmar', flag: '\u{1F1F2}\u{1F1F2}' },
  // N
  { code: 'NA', name: 'Namibia', flag: '\u{1F1F3}\u{1F1E6}' },
  { code: 'NR', name: 'Nauru', flag: '\u{1F1F3}\u{1F1F7}' },
  { code: 'NP', name: 'Nepal', flag: '\u{1F1F3}\u{1F1F5}' },
  { code: 'NL', name: 'Netherlands', flag: '\u{1F1F3}\u{1F1F1}' },
  { code: 'NZ', name: 'New Zealand', flag: '\u{1F1F3}\u{1F1FF}' },
  { code: 'NI', name: 'Nicaragua', flag: '\u{1F1F3}\u{1F1EE}' },
  { code: 'NE', name: 'Niger', flag: '\u{1F1F3}\u{1F1EA}' },
  { code: 'NG', name: 'Nigeria', flag: '\u{1F1F3}\u{1F1EC}' },
  { code: 'MK', name: 'North Macedonia', flag: '\u{1F1F2}\u{1F1F0}' },
  { code: 'NO', name: 'Norway', flag: '\u{1F1F3}\u{1F1F4}' },
  // O
  { code: 'OM', name: 'Oman', flag: '\u{1F1F4}\u{1F1F2}' },
  // P
  { code: 'PK', name: 'Pakistan', flag: '\u{1F1F5}\u{1F1F0}' },
  { code: 'PW', name: 'Palau', flag: '\u{1F1F5}\u{1F1FC}' },
  { code: 'PS', name: 'Palestine', flag: '\u{1F1F5}\u{1F1F8}' },
  { code: 'PA', name: 'Panama', flag: '\u{1F1F5}\u{1F1E6}' },
  { code: 'PG', name: 'Papua New Guinea', flag: '\u{1F1F5}\u{1F1EC}' },
  { code: 'PY', name: 'Paraguay', flag: '\u{1F1F5}\u{1F1FE}' },
  { code: 'PE', name: 'Peru', flag: '\u{1F1F5}\u{1F1EA}' },
  { code: 'PH', name: 'Philippines', flag: '\u{1F1F5}\u{1F1ED}' },
  { code: 'PL', name: 'Poland', flag: '\u{1F1F5}\u{1F1F1}' },
  { code: 'PT', name: 'Portugal', flag: '\u{1F1F5}\u{1F1F9}' },
  // Q
  { code: 'QA', name: 'Qatar', flag: '\u{1F1F6}\u{1F1E6}' },
  // R
  { code: 'RO', name: 'Romania', flag: '\u{1F1F7}\u{1F1F4}' },
  { code: 'RU', name: 'Russia', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'RW', name: 'Rwanda', flag: '\u{1F1F7}\u{1F1FC}' },
  // S
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: '\u{1F1F0}\u{1F1F3}' },
  { code: 'LC', name: 'Saint Lucia', flag: '\u{1F1F1}\u{1F1E8}' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '\u{1F1FB}\u{1F1E8}' },
  { code: 'WS', name: 'Samoa', flag: '\u{1F1FC}\u{1F1F8}' },
  { code: 'SM', name: 'San Marino', flag: '\u{1F1F8}\u{1F1F2}' },
  { code: 'ST', name: 'Sao Tome and Principe', flag: '\u{1F1F8}\u{1F1F9}' },
  { code: 'SA', name: 'Saudi Arabia', flag: '\u{1F1F8}\u{1F1E6}' },
  { code: 'SN', name: 'Senegal', flag: '\u{1F1F8}\u{1F1F3}' },
  { code: 'RS', name: 'Serbia', flag: '\u{1F1F7}\u{1F1F8}' },
  { code: 'SC', name: 'Seychelles', flag: '\u{1F1F8}\u{1F1E8}' },
  { code: 'SL', name: 'Sierra Leone', flag: '\u{1F1F8}\u{1F1F1}' },
  { code: 'SG', name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}' },
  { code: 'SK', name: 'Slovakia', flag: '\u{1F1F8}\u{1F1F0}' },
  { code: 'SI', name: 'Slovenia', flag: '\u{1F1F8}\u{1F1EE}' },
  { code: 'SB', name: 'Solomon Islands', flag: '\u{1F1F8}\u{1F1E7}' },
  { code: 'SO', name: 'Somalia', flag: '\u{1F1F8}\u{1F1F4}' },
  { code: 'ZA', name: 'South Africa', flag: '\u{1F1FF}\u{1F1E6}' },
  { code: 'SS', name: 'South Sudan', flag: '\u{1F1F8}\u{1F1F8}' },
  { code: 'ES', name: 'Spain', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'LK', name: 'Sri Lanka', flag: '\u{1F1F1}\u{1F1F0}' },
  { code: 'SD', name: 'Sudan', flag: '\u{1F1F8}\u{1F1E9}' },
  { code: 'SR', name: 'Suriname', flag: '\u{1F1F8}\u{1F1F7}' },
  { code: 'SE', name: 'Sweden', flag: '\u{1F1F8}\u{1F1EA}' },
  { code: 'CH', name: 'Switzerland', flag: '\u{1F1E8}\u{1F1ED}' },
  { code: 'SY', name: 'Syria', flag: '\u{1F1F8}\u{1F1FE}' },
  // T
  { code: 'TW', name: 'Taiwan', flag: '\u{1F1F9}\u{1F1FC}' },
  { code: 'TJ', name: 'Tajikistan', flag: '\u{1F1F9}\u{1F1EF}' },
  { code: 'TZ', name: 'Tanzania', flag: '\u{1F1F9}\u{1F1FF}' },
  { code: 'TH', name: 'Thailand', flag: '\u{1F1F9}\u{1F1ED}' },
  { code: 'TL', name: 'Timor-Leste', flag: '\u{1F1F9}\u{1F1F1}' },
  { code: 'TG', name: 'Togo', flag: '\u{1F1F9}\u{1F1EC}' },
  { code: 'TO', name: 'Tonga', flag: '\u{1F1F9}\u{1F1F4}' },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '\u{1F1F9}\u{1F1F9}' },
  { code: 'TN', name: 'Tunisia', flag: '\u{1F1F9}\u{1F1F3}' },
  { code: 'TR', name: 'Turkey', flag: '\u{1F1F9}\u{1F1F7}' },
  { code: 'TM', name: 'Turkmenistan', flag: '\u{1F1F9}\u{1F1F2}' },
  { code: 'TV', name: 'Tuvalu', flag: '\u{1F1F9}\u{1F1FB}' },
  // U
  { code: 'UG', name: 'Uganda', flag: '\u{1F1FA}\u{1F1EC}' },
  { code: 'UA', name: 'Ukraine', flag: '\u{1F1FA}\u{1F1E6}' },
  { code: 'AE', name: 'United Arab Emirates', flag: '\u{1F1E6}\u{1F1EA}' },
  { code: 'GB', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'UY', name: 'Uruguay', flag: '\u{1F1FA}\u{1F1FE}' },
  { code: 'UZ', name: 'Uzbekistan', flag: '\u{1F1FA}\u{1F1FF}' },
  // V
  { code: 'VU', name: 'Vanuatu', flag: '\u{1F1FB}\u{1F1FA}' },
  { code: 'VA', name: 'Vatican City', flag: '\u{1F1FB}\u{1F1E6}' },
  { code: 'VE', name: 'Venezuela', flag: '\u{1F1FB}\u{1F1EA}' },
  { code: 'VN', name: 'Vietnam', flag: '\u{1F1FB}\u{1F1F3}' },
  // Y
  { code: 'YE', name: 'Yemen', flag: '\u{1F1FE}\u{1F1EA}' },
  // Z
  { code: 'ZM', name: 'Zambia', flag: '\u{1F1FF}\u{1F1F2}' },
  { code: 'ZW', name: 'Zimbabwe', flag: '\u{1F1FF}\u{1F1FC}' },
]

// Lookup map for quick access by code
const _passportMap = new Map<string, Passport>()
ALL_PASSPORTS.forEach(p => _passportMap.set(p.code, p))

export function getPassportByCode(code: string): Passport | undefined {
  // Handle UK -> GB alias
  if (code.toUpperCase() === 'UK') return _passportMap.get('GB')
  return _passportMap.get(code.toUpperCase())
}

// Group by region for the selector UI
export const PASSPORT_REGIONS: Record<string, Passport[]> = {
  'Popular': [
    _passportMap.get('US')!,
    _passportMap.get('GB')!,
    _passportMap.get('CA')!,
    _passportMap.get('AU')!,
    _passportMap.get('DE')!,
    _passportMap.get('FR')!,
    _passportMap.get('NL')!,
    _passportMap.get('IT')!,
    _passportMap.get('ES')!,
    _passportMap.get('JP')!,
    _passportMap.get('KR')!,
    _passportMap.get('SG')!,
    _passportMap.get('IE')!,
    _passportMap.get('SE')!,
    _passportMap.get('NZ')!,
    _passportMap.get('CH')!,
    _passportMap.get('IN')!,
    _passportMap.get('BR')!,
  ].filter(Boolean) as Passport[],

  'Europe': ALL_PASSPORTS.filter(p => [
    'AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CY', 'CZ',
    'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT',
    'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME', 'NL', 'MK',
    'NO', 'PL', 'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES',
    'SE', 'CH', 'UA', 'GB', 'VA',
  ].includes(p.code)),

  'Asia': ALL_PASSPORTS.filter(p => [
    'AF', 'AM', 'AZ', 'BD', 'BT', 'BN', 'KH', 'CN', 'GE', 'IN',
    'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KG', 'LA', 'LB',
    'MY', 'MV', 'MN', 'MM', 'NP', 'KP', 'PK', 'PH', 'SG', 'KR',
    'LK', 'SY', 'TW', 'TJ', 'TH', 'TL', 'TR', 'TM', 'UZ', 'VN',
  ].includes(p.code)),

  'Americas': ALL_PASSPORTS.filter(p => [
    'AG', 'AR', 'BS', 'BB', 'BZ', 'BO', 'BR', 'CA', 'CL', 'CO',
    'CR', 'CU', 'DM', 'DO', 'EC', 'SV', 'GD', 'GT', 'GY', 'HT',
    'HN', 'JM', 'MX', 'NI', 'PA', 'PY', 'PE', 'KN', 'LC', 'VC',
    'SR', 'TT', 'US', 'UY', 'VE',
  ].includes(p.code)),

  'Africa': ALL_PASSPORTS.filter(p => [
    'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD',
    'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET',
    'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG',
    'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW',
    'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG',
    'TN', 'UG', 'ZM', 'ZW',
  ].includes(p.code)),

  'Middle East': ALL_PASSPORTS.filter(p => [
    'BH', 'IR', 'IQ', 'IL', 'JO', 'KW', 'LB', 'OM', 'PS', 'QA',
    'SA', 'SY', 'TR', 'AE', 'YE',
  ].includes(p.code)),

  'Oceania': ALL_PASSPORTS.filter(p => [
    'AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'PG', 'WS',
    'SB', 'TO', 'TV', 'VU',
  ].includes(p.code)),
}
