import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

interface DiseaseMapProps {
  data?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    disease: string;
    cases: number;
  }>;
}

const mockData = [
  { id: '1', latitude: -1.9441, longitude: 30.0619, disease: 'Malaria', cases: 45 },
  { id: '2', latitude: -2.1603, longitude: 29.7382, disease: 'COVID19', cases: 32 },
  { id: '3', latitude: -1.6843, longitude: 29.2252, disease: 'Cholera', cases: 18 },
  { id: '4', latitude: -1.5000, longitude: 30.5219, disease: 'Typhoid', cases: 25 },
];

const diseaseColors = {
  Malaria: "#ff6b6b",
  COVID19: "#4dabf7",
  Cholera: "#51cf66",
  Typhoid: "#ffd43b",
};

export function DiseaseMap({ data = mockData }: DiseaseMapProps) {
  const maxCases = Math.max(...data.map(d => d.cases));
  
  return (
    <div className="h-full min-h-[400px] w-full rounded-lg border bg-background">
      <MapContainer
        center={[-1.9441, 30.0619]} // Centered on Rwanda
        zoom={8}
        className="h-full w-full rounded-lg"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {data.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.latitude, point.longitude]}
            radius={Math.max(5, (point.cases / maxCases) * 20)}
            fillColor={diseaseColors[point.disease as keyof typeof diseaseColors]}
            color={diseaseColors[point.disease as keyof typeof diseaseColors]}
            weight={1}
            opacity={0.8}
            fillOpacity={0.6}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{point.disease}</h3>
                <p className="text-sm">Cases: {point.cases}</p>
                <p className="text-xs text-gray-500">
                  {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}