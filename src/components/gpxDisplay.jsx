import { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


const GPXDataDisplay = ({ gpxData }) => {
    const [maps, setMaps] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState(gpxData);

    useEffect(() => {
        if (gpxData.length > 0) {
            setFilteredData(gpxData);
        }
    }, [gpxData]); // Update filteredData when gpxData changes

    useEffect(() => {
        if (filteredData.length > 0) {
            createMaps();
        }
    }, [filteredData]); // Re-create maps when filteredData changes


    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        if (searchQuery) {
            const filtered = gpxData.filter(data =>
                data.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredData(filtered); // Update filtered data
        }
    };

    const createMaps = () => {
        console.log("Creating maps...");
        maps.forEach(map => map.remove());
        const newMaps = filteredData.map ((data, index) => {
            console.log("Creating map for:", data.name);
            return createMap(data, index);
        });
        setMaps(newMaps); // Update maps
    };

    const getMapId = (data, index) => {
        return `map-${data.name.replace(/\s+/g, '-').toLowerCase()}-${data.date}-${index}`;
    };

    const createMap = (data, index) => {
        console.log("Initializing map for:", name);
        const mapElementId = getMapId(data, index);
        const averageLat = data.coordinates.reduce((sum, coord) => sum + coord.lat, 0) / data.coordinates.length;
        const averageLon = data.coordinates.reduce((sum, coord) => sum + coord.lon, 0) / data.coordinates.length;
        const map = L.map(mapElementId, {
            center: [averageLat, averageLon], // Assuming the first coordinate is the center
            zoom: 14, // Initial zoom level
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const latlngs = data.coordinates.map(coord => [coord.lat, coord.lon]);

        L.polyline(latlngs, { color: 'red' }).addTo(map);

        return map;
    };

    return (
        <div>
            <h2>GPX Data</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Search by name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit">Search</button>
            </form>
            <ul>
                {filteredData.map((data, index) => (
                    <li key={index}>
                        <h3>{data.name}</h3>
                        <p>Distance: {(data.distance * 0.000621371).toFixed(2)} miles</p>
                        <p>Total Time: {convertTotalTimeToReadableFormat(data.totalTime)}</p>
                        <p>Pace: {convertSecondsToPace(data.totalTime, (data.distance * 0.000621371))}</p>
                        <p>Elevation: {(data.elevationChange * 3.28084).toFixed(2)} feet</p>
                        <p>Calories: {(data.totalCalories).toFixed(2)} calories</p>
                        <p>Date: {data.date}</p>
                        <div id={getMapId(data, index)} style={{height: '400px', width: '800px'}}></div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

function convertTotalTimeToReadableFormat(totalTimeInSeconds) {
    const hours = Math.floor(totalTimeInSeconds / 3600);
    const minutes = Math.floor((totalTimeInSeconds % 3600) / 60);
    let readableTime = '';
    if (hours > 0) {
        readableTime += hours + 'h ';
    }
    if (minutes > 0 || hours === 0) {
        readableTime += minutes + 'min';
    }
    return readableTime;
}

function convertSecondsToPace(totalTimeInSeconds, distanceInMiles) {
    const totalMinutes = totalTimeInSeconds / 60;
    const pacePerMile = totalMinutes / distanceInMiles;
    const minutes = Math.floor(pacePerMile);
    const seconds = Math.round((pacePerMile - minutes) * 60);
    return `${minutes} min ${seconds} sec per mile`;
}

export default GPXDataDisplay;