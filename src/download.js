'use strict'

const net = require('net');
const Buffer = require('buffer').Buffer;
const tracker = require('./tracker');

module.exports = torrent => {
    tracker.getPeers(torrent, peers => {
        peers.forEach(download);
});
}

function download(peer){
    const socket = net.Socket();
    socket.on('error', console.log);
    socket.connect(peer.port,peer.ip, () => {
        // socket.write a message here
    });
    onWholeMsg(socket, data => {
        //handle response here 
    });


    socket.on('data', data => {
        // handle response here
    })
}

function onWholeMsg(socket, callback){
    let savedBuf = Buffer.alloc(0);
    let handshake = true;

    socket.on('data', recvBuf => {
        //msgLen calculates length of a whole message
        msgLen = () => 
    })
}