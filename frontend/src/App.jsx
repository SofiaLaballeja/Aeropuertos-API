import { useEffect, useState } from 'react';
import {
    fetchAllAirports,
    fetchAirportByCode,
    createAirport,
    updateAirport,
    deleteAirport,
    fetchPopular,
} from './services/api';
import SearchBar from './components/SearchBar';
import AirportForm from './components/AirportForm';
import AirportList from './components/AirportList';
import AirportMap from './components/AirportMap';
import './App.css';

function App() {
    const [airports, setAirports] = useState([]);
    const [filteredAirports, setFilteredAirports] = useState([]);
    const [popular, setPopular] = useState([]);
    const [selectedAirportInfo, setSelectedAirportInfo] = useState(null);
    const [centerPos, setCenterPos] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingAirport, setEditingAirport] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        loadAirports();
        loadPopular();
    }, []);

    useEffect(() => {
        let result = airports;
        if (searchTerm) {
            result = result.filter((a) =>
                a.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (cityFilter) {
            result = result.filter((a) =>
                a.city.toLowerCase().includes(cityFilter.toLowerCase())
            );
        }
        setFilteredAirports(result);
    }, [searchTerm, cityFilter, airports]);

    const loadAirports = async () => {
        try {
            const data = await fetchAllAirports();
            const valid = data.filter((a) => a.lat != null && a.lng != null);
            setAirports(valid);
        } catch (e) {
            console.error('Error fetching airports', e);
        }
    };

    const loadPopular = async () => {
        try {
            const data = await fetchPopular();
            setPopular(data);
        } catch (e) {
            console.error('Error fetching popular', e);
        }
    };

    const handleSearch = (term) => setSearchTerm(term);
    const handleCityFilter = (city) => setCityFilter(city);

    const handleMarkerClick = async (airport) => {
        const code = airport.iata_faa || airport.icao;
        setSelectedAirportInfo({ code, loading: true });

        try {
            const data = await fetchAirportByCode(code);
            setSelectedAirportInfo({ ...data, loading: false, code });
            setTimeout(loadPopular, 500);
        } catch (e) {
            console.error(e);
            setSelectedAirportInfo({ error: true, code });
        }
    };

    const handlePopularClick = (code) => {
        const target = airports.find((a) => (a.iata_faa || a.icao) === code);
        if (target) {
            setCenterPos([target.lat, target.lng]);
        }
    };

    const handleAirportClick = (airport) => {
        setCenterPos([airport.lat, airport.lng]);
        handleMarkerClick(airport);
    };

    const handleShowCreateForm = () => {
        setEditingAirport(null);
        setShowForm(true);
    };

    const handleShowEditForm = (airport) => {
        setEditingAirport(airport);
        setShowForm(true);
    };

    const handleSaveAirport = async (data) => {
        if (editingAirport) {
            const code = editingAirport.iata_faa || editingAirport.icao;
            await updateAirport(code, data);
            showNotification('Aeropuerto actualizado correctamente');
        } else {
            await createAirport(data);
            showNotification('Aeropuerto creado correctamente');
        }
        setShowForm(false);
        setEditingAirport(null);
        await loadAirports();
        await loadPopular();
    };

    const handleDeleteAirport = async (code) => {
        if (!confirm(`¿Estás seguro de eliminar el aeropuerto ${code}?`)) return;

        try {
            await deleteAirport(code);
            showNotification('Aeropuerto eliminado correctamente');
            setAirports((prev) => prev.filter((a) => (a.iata_faa || a.icao) !== code));
            await loadPopular();
        } catch (e) {
            console.error('Error al eliminar', e);
            showNotification('Error al eliminar aeropuerto', true);
        }
    };

    const showNotification = (message, isError = false) => {
        setNotification({ message, isError });
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <div className="app-container">
            <AirportMap
                airports={filteredAirports}
                selectedAirportInfo={selectedAirportInfo}
                centerPos={centerPos}
                onMarkerClick={handleMarkerClick}
            />

            <div className="glass-panel">
                <h1>Global Airports</h1>
                <p>Explora y descubre aeropuertos interactivos usando React.</p>

                <SearchBar onSearch={handleSearch} onCityFilter={handleCityFilter} />

                <AirportList
                    airports={filteredAirports}
                    popular={popular}
                    onAirportClick={handleAirportClick}
                    onEdit={handleShowEditForm}
                    onDelete={handleDeleteAirport}
                    onPopularClick={handlePopularClick}
                    onShowForm={handleShowCreateForm}
                />
            </div>

            {showForm && (
                <AirportForm
                    airport={editingAirport}
                    onClose={() => {
                        setShowForm(false);
                        setEditingAirport(null);
                    }}
                    onSave={handleSaveAirport}
                />
            )}

            {notification && (
                <div className={`notification ${notification.isError ? 'error' : 'success'}`}>
                    {notification.message}
                </div>
            )}
        </div>
    );
}

export default App;
