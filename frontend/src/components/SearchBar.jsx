import { useState } from 'react';

export default function SearchBar({ onSearch, onCityFilter }) {
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(search);
        onCityFilter(city);
    };

    const handleClear = () => {
        setSearch('');
        setCity('');
        onSearch('');
        onCityFilter('');
    };

    return (
        <form className="search-bar" onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <input
                type="text"
                placeholder="Filtrar por ciudad..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
            />
            <button type="submit" className="btn-search">Buscar</button>
            <button type="button" className="btn-clear" onClick={handleClear}>Limpiar</button>
        </form>
    );
}
