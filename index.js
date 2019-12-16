'use strict';

const tracker = require('./tracker');
const torrenParser = require('./torrent-parser');

const torrent = torrenParser.open('music.torrent');

tracker.getPeers(torrent,peers => {
    console.log(`list of peers ${peers[0].ip}, ${peers[0].port}`);
})