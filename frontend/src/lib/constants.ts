export const DAR_DISTRICTS = ["Kinondoni", "Ilala", "Temeke", "Ubungo", "Kigamboni"];

export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "room", label: "Room" },
  { value: "office", label: "Office" },
  { value: "shop", label: "Shop" },
  { value: "land", label: "Land" },
];

// Property types with no bedrooms/bathrooms and no "units" concept.
export const NO_UNIT_TYPES = new Set(["land"]);

export const PROPERTY_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPES.map((p) => [p.value, p.label])
);
