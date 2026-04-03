const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

// INCREASE LIMIT for base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// 1. DATABASE CONNECTION
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Could not connect to MongoDB", err));

// 2. DEFINE THE DATA SCHEMA
const bannerSchema = new mongoose.Schema({
    name: String,
    city: String,    // Added city field
    mobile: String,
    imageBase64: String,
    createdAt: { type: Date, default: Date.now }
});

const Banner = mongoose.model('Banner', bannerSchema);

// 3. API ROUTE TO SAVE DATA
app.post('/api/save-banner', async (req, res) => {
    try {
        const { name, city, mobile, imageBase64 } = req.body; // Destructure city
        const newBanner = new Banner({ name, city, mobile, imageBase64 });
        await newBanner.save();
        res.status(201).send({ message: "Data saved to database successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error saving to database" });
    }
});

app.get('/imagegenerator.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/imagegenerator.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});