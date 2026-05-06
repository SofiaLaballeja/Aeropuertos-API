import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ centerPos }) {
    const map = useMap();
    useEffect(() => {
        if (centerPos) {
            map.flyTo(centerPos, 8, { duration: 1.5 });
        }
    }, [centerPos, map]);
    return null;
}

export default function AirportMap({
    airports,
    selectedAirportInfo,
    centerPos,
    onMarkerClick,
}) {
    return (
        <MapContainer
            center={[20, 0]}
            zoom={3}
            zoomControl={true}
            className="map-container"
        >
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={20}
            />
            <MapController centerPos={centerPos} />

            <MarkerClusterGroup
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
                chunkedLoading={true}
            >
                {airports.map((airport, idx) => {
                    const code = airport.iata_faa || airport.icao;
                    if (!code) return null;

                    return (
                        <Marker
                            key={`${code}-${idx}`}
                            position={[airport.lat, airport.lng]}
                            eventHandlers={{
                                click: () => onMarkerClick(airport)
                            }}
                        >
                            <Popup>
                                {selectedAirportInfo?.code === code && selectedAirportInfo?.loading ? (
                                    <div className="custom-popup">Cargando detalles...</div>
                                ) : selectedAirportInfo?.code === code && selectedAirportInfo?.error ? (
                                    <div className="custom-popup">Error obteniendo datos.</div>
                                ) : selectedAirportInfo?.code === code ? (
                                    <div className="custom-popup">
                                        <h2>{selectedAirportInfo.name || 'Aeropuerto Desconocido'}</h2>
                                        <p><strong>Código:</strong> {code}</p>
                                        <p><strong>Ciudad:</strong> {selectedAirportInfo.city || '-'}</p>
                                        <p><strong>Elevación:</strong> {selectedAirportInfo.alt ? selectedAirportInfo.alt + ' ft' : '-'}</p>
                                        <p><strong>Zona Horaria:</strong> {selectedAirportInfo.tz || '-'}</p>
                                    </div>
                                ) : (
                                    <div className="custom-popup">Haz click para cargar...</div>
                                )}
                            </Popup>
                        </Marker>
                    );
                })}
            </MarkerClusterGroup>
        </MapContainer>
    );
}
