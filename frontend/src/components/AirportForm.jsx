import { useState, useEffect } from 'react';

export default function AirportForm({ airport, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        city: '',
        iata_faa: '',
        icao: '',
        lat: '',
        lng: '',
        alt: '',
        tz: '',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (airport) {
            setFormData({
                name: airport.name || '',
                city: airport.city || '',
                iata_faa: airport.iata_faa || '',
                icao: airport.icao || '',
                lat: airport.lat || '',
                lng: airport.lng || '',
                alt: airport.alt || '',
                tz: airport.tz || '',
            });
        }
    }, [airport]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const parsedData = {
            ...formData,
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng),
            alt: formData.alt ? parseFloat(formData.alt) : undefined,
        };

        if (isNaN(parsedData.lat) || isNaN(parsedData.lng)) {
            setError('Latitud y longitud son obligatorios y deben ser números');
            return;
        }

        try {
            await onSave(parsedData);
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{airport ? 'Editar Aeropuerto' : 'Crear Aeropuerto'}</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit} className="airport-form">
                    <div className="form-group">
                        <label>Nombre *</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Ciudad *</label>
                        <input type="text" name="city" value={formData.city} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Código IATA/FAA *</label>
                        <input type="text" name="iata_faa" value={formData.iata_faa} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Código ICAO *</label>
                        <input type="text" name="icao" value={formData.icao} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Latitud *</label>
                            <input type="number" step="any" name="lat" value={formData.lat} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Longitud *</label>
                            <input type="number" step="any" name="lng" value={formData.lng} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Altitud (ft)</label>
                            <input type="number" name="alt" value={formData.alt} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Zona Horaria</label>
                            <input type="text" name="tz" value={formData.tz} onChange={handleChange} placeholder="America/Argentina/Buenos_Aires" />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-save">{airport ? 'Actualizar' : 'Crear'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
