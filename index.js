'use strict';

const tracker = require('./src/tracker');
const torrenParser = require('./src/torrent-parser');

const torrent = torrenParser.open(process.argv[2]);

// download(torrent);
tracker.getPeers(torrent,peers => {
    peers.forEach(peer => {
        console.log(`peer: ${peer.ip}, ${peer.port}`)
    });
})