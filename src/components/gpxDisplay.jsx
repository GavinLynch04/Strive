import { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// React component to display gpx activities
const GPXDataDisplay = ({ gpxData }) => {
    const [maps, setMaps] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState(gpxData);

    // when gpxData changes change filtered data
    useEffect(() => {
        if (gpxData.length > 0) {
            setFilteredData(gpxData);
        }
    }, [gpxData]);

    // Remakes all maps when the data changes
    useEffect(() => {
        if (filteredData.length > 0) {
            createMaps();
        }
    }, [filteredData]);


    // handles the submission of a search query
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        if (searchQuery) {
            const filtered = gpxData.filter(data =>
                data.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredData(filtered); // Update filtered data
        }
    };

    // handles deletion of run activities
    const handleDelete = async (index) => {
        // copy filteredData to avoid changing state directly
        const updatedData = [...filteredData];
        const deletedItem = updatedData.splice(index, 1)[0];

        try {
            console.log(deletedItem._id)
            // send a delete request to the backend to delete the data from the database
            const response = await fetch(`http://localhost:5001/delete/${deletedItem._id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                console.log('Data deleted successfully from the database');
            } else {
                console.error('Failed to delete data from the database');
            }
        } catch (error) {
            console.error('Error deleting data from the database:', error);
        }

        // update the filteredData state with the modified data
        setFilteredData(updatedData);
    };

    // function to create a map for each run, looping through the data
    const createMaps = () => {
        console.log("Creating maps...");
        maps.forEach(map => map.remove());
        const newMaps = filteredData.map ((data, index) => {
            console.log("Creating map for:", data.name);
            return createMap(data, index);
        });
        setMaps(newMaps); // Update maps
    };

    // function to create a unique map id for each run
    const getMapId = (data, index) => {
        return `map-${data.name.replace(/\s+/g, '-').toLowerCase()}-${data.date}-${index}`;
    };

    // function to create the maps on the homepage using Leaflet
    const createMap = (data, index) => {
        console.log("Initializing map for:", name);
        const mapElementId = getMapId(data, index);
        const averageLat = data.coordinates.reduce((sum, coord) => sum + coord.lat, 0) / data.coordinates.length;
        const averageLon = data.coordinates.reduce((sum, coord) => sum + coord.lon, 0) / data.coordinates.length;
        const map = L.map(mapElementId, {
            center: [averageLat, averageLon],
            zoom: 13,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const latlngs = data.coordinates.map(coord => [coord.lat, coord.lon]);

        L.polyline(latlngs, { color: 'red' }).addTo(map);

        return map;
    };

    // HTML to display items on homepage
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
                        <button onClick={() => handleDelete(index)}>Delete</button>
                        <div id={getMapId(data, index)} style={{height: '400px', width: '800px'}}></div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// Function to convert the time to a format that is easy to read
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

// Function to calculate pace given sec and distance
function convertSecondsToPace(totalTimeInSeconds, distanceInMiles) {
    const totalMinutes = totalTimeInSeconds / 60;
    const pacePerMile = totalMinutes / distanceInMiles;
    const minutes = Math.floor(pacePerMile);
    const seconds = Math.round((pacePerMile - minutes) * 60);
    return `${minutes} min ${seconds} sec per mile`;
}

export default GPXDataDisplay;