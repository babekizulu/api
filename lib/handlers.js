/*
* Request Handlers
*
*/

//Dependencies
const _data = require('./data');
const helpers = require('./helpers');

//Define handlers 
const handlers = {};

//Users Handler 
handlers.users = (data, callback) => {
    const acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
    if(acceptableMethods.indexOf(data.method)) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

//Container for the Users Sub-Methods 
handlers._users = {};

//Users - post 
//Required data: firstName, lastName, phone, password, tosAgreement
//Optional data: none
handlers._users.post = (data, callback) => {
    //Check that all required fields are filled out
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        //Make sure that the user doesn't already exist
        _data.read('users', phone, (err, data) => {
            if (err) {
                //Hash the password
                const hashedPassword = helpers.hash(password);

                //If the password is hashed,
                // create and store the user
                if (hashedPassword) {
                    //Create the user object
                    const userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'phone' : phone, 
                        'hashedPassword' : hashedPassword,
                        'tosAgreement' : true
                    }

                    //Store the User
                    _data.create('users', phone, userObject, err => {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error' : 'Could not create new user'});
                        }
                    })
                } else {
                    callback(500, {'Error' : 'Could not hash the users password'})
                }
            } else {
                //User already exists
                callback(400, {'Error' : 'A user with that phone number already exists'})
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
}
//Users - get
handlers._users.get = (data, callback) => {

}
//Users - put
handlers._users.put = (data, callback) => {

}
//Users - delete 
handlers._users.delete = (data, callback) => {

}

//Ping Handler
handlers.ping = (data, callback) => {
    callback(200);
}

//Not found handler
handlers.notFound = (data, callback) => {
    callback(404);
};

//Export Handlers 
module.exports = handlers;