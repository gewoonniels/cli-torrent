'use strict';

const dgram = require('dgram');
const buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto');
const util = require('./util');
const torrentParser = require('./torrent-parser');

module.exports.getPeers = (torrent, callback) => {
    // create a socket, a socket is an object through which network communication can happen
    const socket = dgram.createSocket('udp4');

    let url = torrent.announce.toString('utf8');    
    if(torrent['announce-list'] && url.substring(0,3) !== "udp"){
        const list = torrent['announce-list'];
        for(var i = 0; i < list.length; i++){
            if(list[i].toString('utf8').substring(0,3) === "udp"){
                url = list[i].toString('utf8');
            }
        }
    }
    
    // step 1) send the request to connect
    udpSend(socket, buildConnReq(),url);
    
    socket.on('message', response => {
        if(respType(response) === 'connect'){
            //step 2) receive and parse connect response
            const connResp = parseConnResp(response);
            // step 3) send announce request
            const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
            udpSend(socket, announceReq,url);
        } else if(respType(response) === 'announce'){
            // step 4) parse annouce response
            const announceResp = parseAnnounceResp(response);
            // step 5)
            callback(announceResp.peers);
        }
    });
};


//function to send udp messages with standard values
function udpSend(socket, message, rawUrl, callback=()=>{}) {
    const url = urlParse(rawUrl);
    socket.send(message, 0, message.length, url.port, url.hostname, callback);
}

function respType(resp) {
    const action = resp.readUInt32BE(0);
    return action === 0 ? 'connect' : 'announce';
}

function buildConnReq() {
    const buf = Buffer.alloc(16);
    // Connection ID
    // connection request should always have 0x41727101980, 
    // nodeJS dont have a methode to write precise 64 bit integers. So we do 32 bit twice
    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);
    //action 
    // should always be 0 for connection request
    buf.writeUInt32BE(0, 8);
    //transaction id
    // should de random
    crypto.randomBytes(4).copy(buf, 12);

    return buf;
}

function parseConnResp(resp) {
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        connectionId: resp.slice(8)
    }
}

function buildAnnounceReq(connId, torrent, port=6881) {
    const buf = Buffer.allocUnsafe(98);

    //connection id
    connId.copy(buf, 0);
    //action
    buf.writeUInt32BE(1,8);
    //transaction id
    crypto.randomBytes(4).copy(buf, 12);
    //info hash
    torrentParser.infoHash(torrent).copy(buf,16);
    //peer id
    util.getId().copy(buf,36);
    Buffer.alloc(8).copy(buf, 56);
    // left
    torrentParser.size(torrent).copy(buf, 64);
    // uploaded
    Buffer.alloc(8).copy(buf, 72);
    // event
    buf.writeUInt32BE(0, 80);
    // ip address
    buf.writeUInt32BE(0, 80);
    // key
    crypto.randomBytes(4).copy(buf, 88);
    // num want
    buf.writeInt32BE(-1, 92);
    // port
    buf.writeUInt16BE(port, 96);

    return buf;
}

function parseAnnounceResp(resp) {
    return {
        action: resp.readUInt32BE(0),
        transactionId: resp.readUInt32BE(4),
        leechers: resp.readUInt32BE(8),
        seeders: resp.readUInt32BE(12),
        peers: util.group(resp.slice(20), 6).map(adress => {
            return {
                ip: adress.slice(0,4).join('.'),
                port: adress.readUInt16BE(4)
            }
        })
    }
}

