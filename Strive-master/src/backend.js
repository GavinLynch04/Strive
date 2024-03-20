// server.js
import express from "express";

import multer from "multer";

import gpxParse from "gpx-parse";

import { MongoClient } from "mongodb";
import * as fs from "fs";

const app = express();
const port = 5001;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

let dbClient;

// Replace the connection string with your MongoDB Atlas connection string
const mongoURL = 'mongodb+srv://gavinlynch04:Gavin404@cluster0.tmxz9za.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'gpxData';

MongoClient.connect(mongoURL, { useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to MongoDB Atlas');
        dbClient = client;
    })
    .catch(error => {
        console.error('Error connecting to MongoDB Atlas:', error);
    });

// Multer configuration for file upload
const upload = multer({ dest: 'uploads/' });

// Middleware to parse GPX files and save data to MongoDB
app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = req.file.path;

    gpxParse.parseGpxFromFile(filePath, (error, data) => {
        if (error) {
            console.error('Error parsing GPX file:', error);
            res.status(500).send('Error parsing GPX file');
            return;
        }
        // Define constants for calorie calculation
        const MET = 4; // Metabolic equivalent for running (assuming running activity)
        const weightKg = 70; // User's weight in kilograms (replace with actual value)

        // Calculate total time, total elevation change, average heart rate, total calories, and average cadence
        let totalTime = 0;
        let totalSteps = 0;
        let totalStepsSamples = 0;
        let prevTime = null;

        const coordinates = [];
        data.tracks.forEach(track => {
            track.segments.forEach(segment => {
                segment.forEach(point => {
                    coordinates.push({ lat: point.lat, lon: point.lon });
                });
            });
        });

        data.tracks.forEach(track => {
            track.segments.forEach(segment => {
                segment.forEach(point => {
                    if (point.time && point.time instanceof Date) {
                        if (prevTime !== null) {
                            totalTime += point.time.getTime() - prevTime.getTime();
                        }
                        prevTime = point.time;
                    }
                    if (point.extensions && point.extensions.steps) {
                        totalSteps += point.extensions.steps;
                        totalStepsSamples++;
                    }
                });
            });
        });

        const averageCadence = totalStepsSamples > 0 ? totalSteps / totalStepsSamples : 0;
        const totalTimeInSeconds = totalTime / 1000; // Convert total time to seconds

        // Calculate total calories burned using MET formula
        const totalCalories = MET * weightKg * totalTimeInSeconds / 3600;

        const gpxData = {
            name: data.tracks[0].name,
            date: data.tracks[0]?.segments[0]?.[0]?.time,
            distance: calculateDistance(data.tracks[0].segments),
            totalTime: totalTimeInSeconds,
            elevationChange: calculateElevationGain(data.tracks[0].segments),
            averageHeartRate: 0 /*extractHRFromGPX(filePath)*/,
            totalCalories: totalCalories,
            averageCadence: averageCadence,
            type: 'running',
            coordinates: coordinates,
        };
        console.log('Parsed GPX Data:', gpxData);

        const db = dbClient.db(dbName);
        const collection = db.collection('gpxData');

        collection.insertOne(gpxData, (err, result) => {
            if (err) {
                console.error('Error saving data to MongoDB:', err);
                res.status(500).send('Error saving data to MongoDB');
                return;
            }
            console.log('Data saved successfully:', result.ops[0]);
            res.status(200).send('File uploaded and data saved successfully');
        });
    });
});

app.get('/gpxdata', async (req, res) => {
    try {
        const db = dbClient.db(dbName);
        const collection = db.collection('gpxData');

        const docs = await collection.find({}).toArray();
        res.status(200).json(docs);
    } catch (err) {
        console.error('Error fetching GPX data from MongoDB:', err);
        res.status(500).send('Error fetching GPX data from MongoDB');
    }
});

function calculateDistance(segments) {
    let totalDistance = 0;

    segments.forEach((segment) => {
        for (let i = 1; i < segment.length; i++) {
            const lat1 = segment[i - 1].lat;
            const lon1 = segment[i - 1].lon;
            const lat2 = segment[i].lat;
            const lon2 = segment[i].lon;
            totalDistance += calculateDistanceBetweenPoints(lat1, lon1, lat2, lon2);
        }
    });

    return totalDistance;
}

function calculateElevationGain(segments) {
    let elevationGain = 0;

    segments.forEach(segment => {
        for (let i = 1; i < segment.length; i++) {
            const elevationChange = segment[i].elevation - segment[i - 1].elevation;
            if (elevationChange > 0) {
                elevationGain += elevationChange;
            }
        }
    });

    return elevationGain;
}

function calculateDistanceBetweenPoints(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371000; // meters
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;
    return distance;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});