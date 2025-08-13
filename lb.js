const http = require('http');
const { pick } = require('./algorithm');

const LISTEN_HOST = '0.0.0.0';
const LISTEN_PORT = 8080;
const ALGO = process.env.ALGO || 'round-robin';

// Define our upstream pool (A, B, C)
const upstreams = [
    { id: 'A', host: '127.0.0.1', port: 9001, inFlight: 0, total: 0, errors: 0 },
    { id: 'B', host: '127.0.0.1', port: 9002, inFlight: 0, total: 0, errors: 0 },
    { id: 'C', host: '127.0.0.1', port: 9003, inFlight: 0, total: 0, errors: 0 },
];

function statsJson() {
    return JSON.stringify({
        algo: ALGO,
        upstreams: upstreams.map(u => ({ id: u.id, inFlight: u.inFlight, total: u.total, errors: u.errors }))
    }, null, 2);
}

const server = http.createServer((req, res) => {
    // simple LB control endpoints for visibility
    if (req.url === '/__stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(statsJson());
    }
    // Step 1: Choose target server
    //Pick an upstream service based on the load balancing algorithm
    const target = pick(ALGO, upstreams, req);

    if (!target) {
        res.statusCode = 503; return res.end('No upstream available');
    }

    target.inFlight++;
    target.total++;

    const options = {
        host: target.host,
        port: target.port,
        method: req.method,
        path: req.url,
        headers: req.headers,
    };

    // Step 2: Create outgoing request to upstream
    //The LB forwards the client's method, path, and headers as-is to the upstream.
    const upstreamReq = http.request(options, (upstreamRes) => {
        // Step 4: Handle upstream's response
        res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
        upstreamRes.pipe(res);

        upstreamRes.on('end', () => {
            target.inFlight--;
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${target.id} (status ${upstreamRes.statusCode})`);
        });
    });

    // Error handling for upstream request
    upstreamReq.on('error', (err) => {
        target.inFlight--; target.errors++;
        console.error(`Upstream ${target.id} error:`, err.message);
        res.statusCode = 502; res.end('Bad gateway');
    });

    // Step 3: Pipe client's request body to upstream
    req.pipe(upstreamReq);
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
    console.log(`LB listening on http://${LISTEN_HOST}:${LISTEN_PORT} (ALGO=${ALGO})`);
    console.log('Try:  curl http://localhost:8080  |  curl http://localhost:8080/__stats');
});


//In this setup, your load balancer isn’t storing the whole request or response in memory;
//  it’s just streaming data between the client and whichever upstream server you picked.