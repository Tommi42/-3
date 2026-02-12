export interface Location {
  lat: number;
  lng: number;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  location: Location;
  imageUrl: string;
  videoUrl?: string;
}

export enum ViewMode {
  Map = 'MAP',
  Gallery = 'GALLERY'
}