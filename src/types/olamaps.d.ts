declare global {
  interface Window {
    OlaMaps: {
      Map: new (options: {
        container: string;
        style: string;
        center: [number, number];
        zoom: number;
      }) => {
        destroy: () => void;
        panTo: (coordinates: [number, number]) => void;
        addRoute: (options: {
          id: string;
          coordinates: [number, number][];
          color: string;
          width: number;
          opacity: number;
        }) => void;
      };
      Marker: new () => {
        setLngLat: (coordinates: [number, number]) => Marker;
        setColor: (color: string) => Marker;
        addTo: (map: Map) => void;
      };
    };
  }
}

export {};