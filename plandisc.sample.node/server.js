const express = require('express');
const fs = require('fs');

const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
}

const json = fs.readFileSync('keys.json', 'utf8');
const data = JSON.parse(json);
const CLIENT_ID = data.client_id;
const CLIENT_SECRET = data.client_secret;
//const apiUrl = 'https://localhost:44370/publicapi';
const apiUrl = 'https://api.plandisc.com';


const SCOPES = [
    "plandisc:plandisc.read",
    "plandisc:activity.read",
];

let plandiscAccessToken = null;

const app = express();

// Return index.html when calling root URL
app.get('/', (req, res) => {
    console.log(`Return index.html`);
    res.sendFile(__dirname + '/index.html');
});

app.get('/api/plandiscs', async (req, res) => {
    const url = `${apiUrl}/v1/plandiscs?limit=20`;
    const headers = { ...DEFAULT_HEADERS, 'Authorization': `Bearer ${plandiscAccessToken}`, 'Accept': 'application/json' };
    
    console.log(`Sending request: ${url}`);
    const resp = await fetch(url, { method: 'GET', headers: headers });
    await handleApiResponse(resp, res);
});

app.get('/api/views', async (req, res) => {
    const plandiscId = req.query.plandiscId ?? 0;
    const url = `${apiUrl}/v1/plandiscs/${plandiscId}/embeddedViews`;
    const headers = { ...DEFAULT_HEADERS, 'Authorization': `Bearer ${plandiscAccessToken}`, 'Accept': 'application/json' };
    
    console.log(`Sending request: ${url}`);
    const resp = await fetch(url, { method: 'GET', headers: headers });
    await handleApiResponse(resp, res);
});

app.get('/api/viewToken', async (req, res) => {
    const viewId = req.query.viewId ?? 0;
    const url = `${apiUrl}/v1/tokens/embeddedView`;
    const headers = { ...DEFAULT_HEADERS, 'Authorization': `Bearer ${plandiscAccessToken}`, 'Accept': 'application/json' };
    const body = JSON.stringify({ 'embedded_view_id': viewId });
    
    console.log(`Sending request: ${url}`);
    const resp = await fetch(url, { method: 'POST', headers: headers, body: body });
    await handleApiResponse(resp, res);  
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
            const url = `${apiUrl}/v1/tokens/connect`;
            console.log(`Sending request: ${url}`);
            const response = await fetch(url, req_opts);
            console.log(`StatusCode: ${response.status}`);

            if (response.status === 200) {
                const data = await response.json();
                plandiscAccessToken = data.accessToken;
                console.log('Received Plandisc Access Token');
            } else {
                const respText = await response.text();
                console.error(respText);
            }
        }
        catch (err) {
            console.error('Failed to fetch Plandisc Access Token', err);
        }
    })();
});


async function handleApiResponse(resp, res) {
    console.log(`StatusCode: ${resp.status}`);
    if (resp.status === 200) {
        const data = await resp.json();
        res.send(data);
    } else {
        const respText = await resp.text();
        console.error(respText);
    }
}
