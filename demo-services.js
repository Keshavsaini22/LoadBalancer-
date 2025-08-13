const http = require('http');

const services = [
    { id: 'A', port: 9001, delayMs: 100 },  // fast
    { id: 'B', port: 9002, delayMs: 500 },  // medium
    { id: 'C', port: 9003, delayMs: 900 },  // slow
];

for (const svc of services) {
    let hits = 0; //hits keeps track of how many requests that particular service has handled.

    const server = http.createServer((req, res) => {  //Creates an HTTP server

        if (req.url === '/__health') { //If a request comes to /__health, it responds immediately with OK
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            return res.end('OK');
        }

        hits++;

        setTimeout(() => {
            const body = `Service ${svc.id} handled request #${hits}\n`;
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(body);
        }, svc.delayMs);

    });

    server.listen(svc.port, '127.0.0.1', () => {
        console.log(`Service ${svc.id} listening on http://127.0.0.1:${svc.port} (delay ${svc.delayMs}ms)`);
    });
}