const express = require('express');
const fs = require('fs');

const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
}

const json = fs.readFileSync('keys.json', 'utf8');
const data = JSON.parse(json);
const CLIENT_ID = data.client_id;
const CLIENT_SECRET = data.client_secret;

const SCOPES = [
    "plandisc:plandisc.read",
    "plandisc:activity.read",
];

let plandiscAccessToken = null;

const app = express();

// Return index.html when calling root URL
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/api/plandiscs', async (req, res) => {
    const headers = { ...DEFAULT_HEADERS, 'Authorization': `Bearer ${plandiscAccessToken}`, 'Accept': 'application/json' };
    const resp = await fetch(`https://api.plandisc.com/v1/plandiscs?limit=20`, { method: 'GET', headers: headers });
    const data = await resp.json();
    res.send(data);
});

app.get('/api/views', async (req, res) => {
    const plandiscId = req.query.plandiscId ?? 0;
    const headers = { ...DEFAULT_HEADERS, 'Authorization': `Bearer ${plandiscAccessToken}`, 'Accept': 'application/json' };
    const resp = await fetch(`https://api.plandisc.com/v1/plandiscs/${plandiscId}/embeddedViews`, { method: 'GET', headers: headers });
    const data = await resp.json();
    res.send(data);
});

// Specify the port to listen on
const port = 3000;

// Start the server
app.listen(port, () => {
    console.log(`Node.js HTTP server is running on http://localhost:${port}`);

    (async () => {
        try {
            const req_body = {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                scopes: SCOPES
            };
            const req_opts = {
                method: 'POST',
                headers: DEFAULT_HEADERS,
                body: JSON.stringify(req_body)
            };
            const response = await fetch('https://api.plandisc.com/v1/tokens/connect', req_opts);
            const data = await response.json();
            plandiscAccessToken = data.accessToken;
            console.log('Received Plandisc Access Token');
        }
        catch (err) {
            console.err('Failed to fetch Plandisc Access Token', err);
        }
    })();
});