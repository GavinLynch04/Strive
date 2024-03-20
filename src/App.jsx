import './App.css'
import { useState, useEffect } from 'react';
import FileUploadForm from './components/fileUpload.jsx';
import GPXDataDisplay from './components/gpxDisplay.jsx';

function App() {
    const [gpxData, setGPXData] = useState([]);

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

    useEffect(() => {
        fetchGPXData();
    }, []); // Fetch data on component mount

    const handleFileUpload = (file) => {
        const formData = new FormData();
        formData.append('file', file);

        return fetch('http://localhost:5001/upload', {
            method: 'POST',
            body: formData,
        });

    };

    const handleUploadSuccess = () => {
        fetchGPXData(); // Refresh data after successful upload
    };

    return (
        <div>
            <FileUploadForm onFileUpload={handleFileUpload} onUploadSuccess={handleUploadSuccess} />
            <GPXDataDisplay gpxData={gpxData} />
        </div>
    );
}

export default App;
