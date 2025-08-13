
const crypto = require('crypto');

let rrIndex = -1; // round-robin pointer

function roundRobin(list) {
    if (!list.length) return null;

    rrIndex = (rrIndex + 1) % list.length;

    return list[rrIndex];
}

function leastConnections(list) {
    if (!list.length) return null;

    return list.reduce((a, b) => (a.inFlight <= b.inFlight ? a : b));
}

function ipHash(list, key) {
    if (!list.length) return null;

    const h = crypto.createHash('sha1').update(String(key)).digest();
    const idx = h.readUInt32BE(0) % list.length;

    return list[idx];
}

function getClientIp(req) {
    const fwd = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(fwd) ? fwd[0] : (fwd || req.socket.remoteAddress || '0.0.0.0'))
        .split(',')[0].trim();
    return ip;
}

function pick(algorithm, list, req) {
    if (!list.length) return null;
    switch (algorithm) {
        case 'least-connections':
            return leastConnections(list);
        case 'ip-hash':
            return ipHash(list, getClientIp(req));
        case 'round-robin':
        default:
            return roundRobin(list);
    }
}

module.exports = { roundRobin, leastConnections, ipHash, pick, getClientIp };