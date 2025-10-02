export const continents = [
  {
    name: "Africa",
    countries: [
      "Algeria",
      "Cameroon",
      "Egypt",
      "Ghana",
      "Ivory Coast",
      "Morocco",
      "Nigeria",
      "Senegal",
      "South Africa",
      "Tunisia"
    ]
  },
  {
    name: "Asia",
    countries: [
      "Australia",
      "China",
      "Iran",
      "Japan",
      "Qatar",
      "Saudi Arabia",
      "South Korea",
      "Thailand",
      "United Arab Emirates",
      "Uzbekistan"
    ]
  },
  {
    name: "Europe",
    countries: [
      "Austria",
      "Belgium",
      "Croatia",
      "Denmark",
      "England",
      "France",
      "Germany",
      "Italy",
      "Netherlands",
      "Norway",
      "Portugal",
      "Scotland",
      "Spain",
      "Sweden",
      "Switzerland"
    ]
  },
  {
    name: "North America",
    countries: [
      "Canada",
      "Costa Rica",
      "Honduras",
      "Jamaica",
      "Mexico",
      "Panama",
      "Trinidad and Tobago",
      "United States"
    ]
  },
  {
    name: "South America",
    countries: [
      "Argentina",
      "Brazil",
      "Chile",
      "Colombia",
      "Ecuador",
      "Paraguay",
      "Peru",
      "Uruguay",
      "Venezuela"
    ]
  },
  {
    name: "Oceania",
    countries: [
      "Fiji",
      "New Zealand",
      "Papua New Guinea",
      "Samoa",
      "Solomon Islands"
    ]
  }
];

export function getCountriesFor(continentName) {
  return continents.find((c) => c.name === continentName)?.countries ?? [];
}
