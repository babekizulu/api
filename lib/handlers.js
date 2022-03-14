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
//Required data: phone 
//Optional data: none
//@TODO Only give authenticated users access to their object.
//@TODO Users can't access other users objects

handlers._users.get = (data, callback) => {
    //Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        //Look up the user
        _data.read('users', phone, (err, data) => {
            if(!err && data) {
                //Remove the hashed password from the user object before returning it to the requester
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        });
    }else {
        callback(400, {'Error' :  'Missing required field'});
    }
}

//Users - put
//Required data: phone
//Optional data: firstName, lastName, password (At least one must be specified)
// @TODO Only let an authenticated user update their own object.
// @TODO A User should not be able to update another user's object 

handlers._users.put = (data, callback) => {
    //Validate the phone number
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    //Validate the optional data (firstName, lastName, password)
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    //Callback an error if the phone number is invalid 
    if (phone) {
        //Error if nothing sent to update
        if (firstName || lastName || password) {
            //Lookup the user
            _data.read('users', phone, (err, userData) => {
                if (!err && userData) {
                    //Update the necessary fields
                    if (firstName) {
                        userData.firstName = firstName;
                    };
                    if (lastName) {
                        userData.lastName = lastName;
                    };
                    if (password) {
                        userData.hashedPassword = helpers.hash(password);
                    }
                    //Store the new updates
                    _data.update('users', phone, userData, err => {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error' : 'Could not update the user'})
                        }
                    })
                } else {
                    callback(400, {'Error' : 'The specified user does not exist'});
                }
            })
        } else {
            callback(400, {'Error' : 'Missing fields to update'});
        }
    } else {
        callback(400, {'Error' : 'Missing required field'});
    }
}
//Users - delete 
//Required data: phone
//@TODO Only let an authenticated user delete their user object
//@TODO A user should not be able to delete another user's object 
//@TODO Cleanup(delete any other data files associated with this user)

handlers._users.delete = (data, callback) => {
    //Validate the phone number
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        //Look up the user
        _data.read('users', phone, (err, data) => {
            if(!err && data) {
              _data.delete('users', phone, err => {
                  if (!err) {
                      callback(200);
                  } else {
                      callback(500, {'Error' : 'Could not delete the specified user'});
                  };
              })
            } else {
                callback(400, {'Error' : 'Could not find the specified user'});
            };
        });
    }else {
        callback(400, {'Error' :  'Missing required field'});
    }
}

//Ping Handler
handlers.ping = (data, callback) => {
    callback(200);
};

//Not found handler
handlers.notFound = (data, callback) => {
    callback(404);
};

//Export Handlers 
module.exports = handlers;