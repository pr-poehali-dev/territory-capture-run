import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface MapViewProps {
  positions: GPSPosition[];
  isRunning: boolean;
}

function MapUpdater({ positions, isRunning }: MapViewProps) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0 && isRunning) {
      const lastPos = positions[positions.length - 1];
      map.setView([lastPos.latitude, lastPos.longitude], map.getZoom());
    }
  }, [positions, isRunning, map]);

  return null;
}

export default function MapView({ positions, isRunning }: MapViewProps) {
  const defaultCenter: [number, number] = [55.7558, 37.6173];
  const center: [number, number] = positions.length > 0
    ? [positions[0].latitude, positions[0].longitude]
    : defaultCenter;

  const pathCoordinates: [number, number][] = positions.map(pos => [pos.latitude, pos.longitude]);

  const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden shadow-lg relative z-0">
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {pathCoordinates.length > 0 && (
          <>
            <Polyline 
              positions={pathCoordinates} 
              color="#FF6B35" 
              weight={4}
              opacity={0.8}
            />
            
            <Marker position={pathCoordinates[0]} icon={startIcon}>
              <Popup>Старт</Popup>
            </Marker>
            
            {!isRunning && pathCoordinates.length > 1 && (
              <Marker position={pathCoordinates[pathCoordinates.length - 1]} icon={endIcon}>
                <Popup>Финиш</Popup>
              </Marker>
            )}
          </>
        )}

        <MapUpdater positions={positions} isRunning={isRunning} />
      </MapContainer>
    </div>
  );
}
