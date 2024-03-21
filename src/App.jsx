import './App.css'
import { useState, useEffect } from 'react';
import FileUploadForm from './components/fileUpload.jsx';
import GPXDataDisplay from './components/gpxDisplay.jsx';

function App() {
    const [gpxData, setGPXData] = useState([]);

    // Function to fetch gpx data from backend and set data
    const fetchGPXData = () => {
        console.log("requesting data");
        fetch('http://localhost:5001/gpxdata')
            .then((response) => response.json())
            .then((data) => {
                setGPXData(data);
                console.log("got data");
            })
            .catch((error) => {
                console.error('Error fetching GPX data:', error);
            });
    };

    // Fetchs gpx data when the homepage loads in
    useEffect(() => {
        fetchGPXData();
    }, []);

    // Handles the upload of files, sends to backend to be processed
    const handleFileUpload = (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetch('http://localhost:5001/upload', {
            method: 'POST',
            body: formData,
        });

    };
    // On upload success call fetch data
    const handleUploadSuccess = () => {
        fetchGPXData(); // Refresh data after successful upload
    };

    // HTML to display elements
    return (
        <div>
            <FileUploadForm onFileUpload={handleFileUpload} onUploadSuccess={handleUploadSuccess} />
            <GPXDataDisplay gpxData={gpxData} />
        </div>
    );
}

export default App;
