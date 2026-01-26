export interface Motorcycle {
  id: number;
  name: string;
  image: string;
  description: string;
  shortDescription: string;
  price: number;
  engineSize: number; // in CCs
  type: "scooter" | "cruiser" | "adventure" | "sport" | "supersport";
}

const motorcycles: Array<Motorcycle> = [
  {
    id: 1,
    name: "Luna-C Urbanite",
    image: "/motorcycle-scooter.jpg",
    description:
      "The Luna-C Urbanite is the perfect city companion, combining style and practicality in a compact package. With its 125cc engine, it delivers excellent fuel efficiency while maintaining enough power for urban commuting. The comfortable seating position and lightweight frame make it easy to maneuver through city traffic, while the under-seat storage provides ample space for your daily essentials.",
    shortDescription:
      "A stylish and practical 125cc scooter perfect for urban commuting with excellent fuel efficiency.",
    price: 3000,
    engineSize: 125,
    type: "scooter",
  },
  {
    id: 2,
    name: "Luna-C Voyager",
    image: "/motorcycle-cruiser.jpg",
    description:
      "The Luna-C Voyager is a classic cruiser that combines comfort with style. Its 750cc engine provides smooth, reliable power for long-distance rides, while the ergonomic design ensures comfort even on extended journeys. The classic cruiser styling with modern touches makes it stand out on any road.",
    shortDescription:
      "A comfortable 750cc cruiser perfect for long-distance rides with classic styling.",
    price: 12000,
    engineSize: 750,
    type: "cruiser",
  },
  {
    id: 3,
    name: "Luna-C Explorer",
    image: "/motorcycle-adventure.jpg",
    description:
      "The Luna-C Explorer is built for adventure, whether you're tackling city streets or exploring off-road trails. Its 850cc engine provides the perfect balance of power and control, while the dual-sport suspension system ensures a smooth ride in any condition. The upright riding position and comfortable seat make it ideal for long journeys.",
    shortDescription:
      "An 850cc adventure bike designed for both on-road and off-road exploration.",
    price: 15000,
    engineSize: 850,
    type: "adventure",
  },
  {
    id: 4,
    name: "Luna-C Velocity",
    image: "/motorcycle-sport.jpg",
    description:
      "The Luna-C Velocity is a high-performance sport bike that delivers thrilling acceleration and precise handling. Its 1000cc engine provides exceptional power, while the aerodynamic design and advanced suspension system ensure optimal performance on the track or the open road. The aggressive styling and premium components make it a true performance machine.",
    shortDescription:
      "A high-performance 1000cc sport bike with exceptional power and handling.",
    price: 20000,
    engineSize: 1000,
    type: "sport",
  },
  {
    id: 5,
    name: "Luna-C Supersport",
    image: "/motorcycle-supersport.jpg",
    description:
      "The Luna-C Supersport represents the pinnacle of motorcycle engineering. Its 1300cc engine delivers breathtaking power and acceleration, while the cutting-edge aerodynamics and race-inspired components ensure maximum performance. This machine is designed for experienced riders who demand the ultimate in speed and handling.",
    shortDescription:
      "The ultimate 1300cc supersport machine with race-inspired performance and aerodynamics.",
    price: 25000,
    engineSize: 1300,
    type: "supersport",
  },
];

export default motorcycles;
