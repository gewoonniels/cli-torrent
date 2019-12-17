'use strict';

const crypto = require('crypto');

let id = null;

module.exports.getId = () => {
    if(!id){
        id = crypto.randomBytes(20);
        Buffer.from('-NV0001-').copy(id, 0);
    }
    return id;
}

module.exports.group = (iterable, size) => {
    let groups = [];
    for(let i = 0; i < iterable.length; i+= size){
        groups.push(iterable.slice(i, i + size));
    }
    return groups;
}