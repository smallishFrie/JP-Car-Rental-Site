export type CarOption = {
  value: string;
  label: string;
};

export type Car = {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  dayRate: number;
  cardImage: string;
  images: string[];
  locations: CarOption[];
};

const defaultLocations: CarOption[] = [
  { value: "jp-main-office", label: "JP Main Office" },
  { value: "airport-terminal", label: "Airport Terminal" },
  { value: "city-drop-point", label: "City Drop Point" },
];

export const testCars: Car[] = [
  {
    id: "civic-sport",
    name: "Civic Sport",
    category: "Sedan",
    tagline: "Balanced city comfort and highway efficiency.",
    description:
      "A smooth all-rounder with practical luggage room, responsive steering, and excellent fuel economy for everyday travel.",
    dayRate: 2800,
    cardImage: "/cars/placeholder-01.svg",
    images: [
      "/cars/placeholder-01.svg",
      "/cars/placeholder-02.svg",
      "/cars/placeholder-03.svg",
    ],
    locations: defaultLocations,
  },
  {
    id: "fortuner-xl",
    name: "Fortuner XL",
    category: "SUV",
    tagline: "Roomy SUV for family trips and weekend escapes.",
    description:
      "Built for comfort over long drives with elevated seating, generous cargo space, and confident road presence.",
    dayRate: 4500,
    cardImage: "/cars/placeholder-02.svg",
    images: [
      "/cars/placeholder-01.svg",
      "/cars/placeholder-02.svg",
      "/cars/placeholder-03.svg",
    ],
    locations: defaultLocations,
  },
  {
    id: "vios-prime",
    name: "Vios Prime",
    category: "Sedan",
    tagline: "Compact and easy to drive in busy streets.",
    description:
      "Perfect for quick city movement, featuring a quiet cabin and reliable handling for daily commutes and errands.",
    dayRate: 2200,
    cardImage: "/cars/placeholder-03.svg",
    images: [
      "/cars/placeholder-01.svg",
      "/cars/placeholder-02.svg",
      "/cars/placeholder-03.svg",
    ],
    locations: defaultLocations,
  },
  {
    id: "hilux-trail",
    name: "Hilux Trail",
    category: "Pickup",
    tagline: "Tough utility pickup with strong cargo capacity.",
    description:
      "A capable choice for mixed work and travel use, offering stable performance and durable construction.",
    dayRate: 3900,
    cardImage: "/cars/placeholder-01.svg",
    images: [
      "/cars/placeholder-01.svg",
      "/cars/placeholder-02.svg",
      "/cars/placeholder-03.svg",
    ],
    locations: defaultLocations,
  },
];

export function getCarById(carId: string): Car | undefined {
  return testCars.find((car) => car.id === carId);
}
