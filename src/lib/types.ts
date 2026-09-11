export interface Campsite {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  image: string;
  intro: string;
  facilities: string[];
  tel?: string;
  homepage?: string;
  type?: string;
  region: string;
}

export interface Review {
  id: string;
  campsiteId: string;
  author: string;
  rating: number;
  content: string;
  createdAt: string;
}
