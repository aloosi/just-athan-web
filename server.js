const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();


app.use(express.static(path.join(__dirname, 'build')));

// API route for prayer times
app.get('/api/prayertimes', async (req, res) => {
    try {
        const { lat, lon, method } = req.query;
        const response = await fetch(`http://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching prayer times');
    }
});

// Fallback to React's index.html for unmatched routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});