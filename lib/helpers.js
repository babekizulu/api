/*
*Helpers for various tasks
*
*/

//Dependencies 
const crypto = require('crypto');
const config = require('./config');

//Container for all the helpers
const helpers = {};

//Create a SHA256 hash 
helpers.hash = str => {
    //Validate the String that's coming in '
    if (typeof(str) == 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    };
};

//Parse a JSON String to an Object, in all cases, without throwing an error
helpers.parseJsonToObject = str => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (err) {
        return {};
    }
};

//Export helpers
module.exports = helpers;