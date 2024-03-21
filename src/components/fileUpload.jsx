import { useState } from 'react';

// react component to display the file upload section
const FileUploadForm = ({ onFileUpload, onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedFile) {
            onFileUpload(selectedFile)
                .then((response) => {
                    console.log('Upload response:', response);
                    // Call the onUploadSuccess callback to trigger a refresh
                    onUploadSuccess();
                })
                .catch((error) => {
                    console.error('Error uploading file:', error);
                });
        } else {
            alert('Please select a file.');
        }
    };

    return (
        <div>
            <h1>STRIVE</h1>
            <h2>Upload GPX File</h2>
            <form onSubmit={handleSubmit}>
                <input type="file" accept=".gpx" onChange={handleFileChange}/>
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default FileUploadForm;
