export default function AirportList({
    airports,
    popular,
    onAirportClick,
    onEdit,
    onDelete,
    onPopularClick,
    onShowForm,
}) {
    return (
        <div className="airport-list-section">
            <div className="list-header">
                <h3>Aeropuertos ({airports.length})</h3>
                <button className="btn-add" onClick={onShowForm}>+ Nuevo</button>
            </div>
            <ul className="airport-items">
                {airports.length === 0 ? (
                    <li className="empty-state">No se encontraron aeropuertos</li>
                ) : (
                    airports.slice(0, 100).map((airport, idx) => {
                        const code = airport.iata_faa || airport.icao;
                        if (!code) return null;
                        return (
                            <li key={`${code}-${idx}`} className="airport-item">
                                <div className="airport-info" onClick={() => onAirportClick(airport)}>
                                    <span className="airport-code">{code}</span>
                                    <span className="airport-name">{airport.name}</span>
                                    <span className="airport-city">{airport.city}</span>
                                </div>
                                <div className="airport-actions">
                                    <button className="btn-edit" onClick={() => onEdit(airport)} title="Editar">✏️</button>
                                    <button className="btn-delete" onClick={() => onDelete(code)} title="Eliminar">🗑️</button>
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>

            <div className="popular-section">
                <h3>🔥 Más Populares</h3>
                <ul className="popular-list">
                    {popular.length === 0 ? (
                        <li className="empty-state">No hay aeropuertos visitados aún. Explora el mapa!</li>
                    ) : (
                        popular.map((item, i) => (
                            <li key={i} className="popular-item" onClick={() => onPopularClick(item.code)}>
                                <span>✈️ {item.name || item.code}</span>
                                <span className="pop-score">
                                    {item.score} <small>visitas</small>
                                </span>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
