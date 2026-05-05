export type Country = {
  code: string; // ISO 3166-1 alpha-2 lowercase, e.g. "us"
  name: string;
};

export const COUNTRIES: Country[] = [
  { code: "dz", name: "Algeria" },
  { code: "ar", name: "Argentina" },
  { code: "au", name: "Australia" },
  { code: "at", name: "Austria" },
  { code: "bh", name: "Bahrain" },
  { code: "bd", name: "Bangladesh" },
  { code: "be", name: "Belgium" },
  { code: "br", name: "Brazil" },
  { code: "ca", name: "Canada" },
  { code: "cl", name: "Chile" },
  { code: "cn", name: "China" },
  { code: "co", name: "Colombia" },
  { code: "hr", name: "Croatia" },
  { code: "cz", name: "Czech Republic" },
  { code: "dk", name: "Denmark" },
  { code: "eg", name: "Egypt" },
  { code: "fi", name: "Finland" },
  { code: "fr", name: "France" },
  { code: "de", name: "Germany" },
  { code: "gh", name: "Ghana" },
  { code: "gr", name: "Greece" },
  { code: "hk", name: "Hong Kong" },
  { code: "hu", name: "Hungary" },
  { code: "in", name: "India" },
  { code: "id", name: "Indonesia" },
  { code: "ie", name: "Ireland" },
  { code: "il", name: "Israel" },
  { code: "it", name: "Italy" },
  { code: "jp", name: "Japan" },
  { code: "jo", name: "Jordan" },
  { code: "ke", name: "Kenya" },
  { code: "kw", name: "Kuwait" },
  { code: "lb", name: "Lebanon" },
  { code: "my", name: "Malaysia" },
  { code: "mx", name: "Mexico" },
  { code: "ma", name: "Morocco" },
  { code: "nl", name: "Netherlands" },
  { code: "nz", name: "New Zealand" },
  { code: "ng", name: "Nigeria" },
  { code: "no", name: "Norway" },
  { code: "om", name: "Oman" },
  { code: "pk", name: "Pakistan" },
  { code: "ph", name: "Philippines" },
  { code: "pl", name: "Poland" },
  { code: "pt", name: "Portugal" },
  { code: "qa", name: "Qatar" },
  { code: "ro", name: "Romania" },
  { code: "ru", name: "Russia" },
  { code: "sa", name: "Saudi Arabia" },
  { code: "sg", name: "Singapore" },
  { code: "za", name: "South Africa" },
  { code: "kr", name: "South Korea" },
  { code: "es", name: "Spain" },
  { code: "se", name: "Sweden" },
  { code: "ch", name: "Switzerland" },
  { code: "tw", name: "Taiwan" },
  { code: "th", name: "Thailand" },
  { code: "tn", name: "Tunisia" },
  { code: "tr", name: "Turkey" },
  { code: "ae", name: "United Arab Emirates" },
  { code: "gb", name: "United Kingdom" },
  { code: "us", name: "United States" },
  { code: "vn", name: "Vietnam" },
];

export function flagUrl(code: string, width: 20 | 40 | 80 = 20): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}

export function findCountryByName(name: string): Country | undefined {
  return COUNTRIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
}
