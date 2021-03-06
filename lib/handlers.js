/*
* Request Handlers
*
*/

//Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

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

handlers._users.get = (data, callback) => {
    //Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        //Get the Token from the Headers
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        //Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, tokenIsValid => {
            if (tokenIsValid) {
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
            } else {
                callback(403, {'Error' : 'Missing required token in header or token is invalid'});
            }
        })
    }else {
        callback(400, {'Error' :  'Missing required field'});
    }
}

//Users - put
//Required data: phone
//Optional data: firstName, lastName, password (At least one must be specified)
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
            //Get the Token from the Headers
            const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

            //Verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token, phone, tokenIsValid => {
                if (tokenIsValid) {
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
                    callback(403, {'Error' : 'Missing required token in header or token is invalid'});
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

handlers._users.delete = (data, callback) => {
    //Validate the phone number
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        //Get the Token from the Headers
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        //Verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, tokenIsValid => {
            if (tokenIsValid) {
                //Look up the user
                _data.read('users', phone, (err,userData) => {
                    if(!err && userData) {
                    _data.delete('users', phone, err => {
                        if (!err) {
                            callback(200);
                            //Delete each of the checks associated with the user
                            const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                            const checksToDelete = userChecks.length;

                            if (checksToDelete > 0) {
                                let checksDeleted = 0;
                                let deletionErrors = false;

                                //Loop through the checks
                                userChecks.forEach(checkId => {
                                    //Delete the check
                                    _data.delete('checks', checkId, err => {
                                        if (err) {
                                            deletionErrors = true;
                                        }
                                        checksDeleted ++;
                                        if (checksDeleted == checksToDelete) {
                                            if (!deletionErrors) {
                                                callback(200);
                                            } else {
                                                callback(500, {'Error' : `Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully`})
                                            }
                                        }
                                    })
                                })
                            } else {
                                callback(200)
                            }
                        } else {
                            callback(500, {'Error' : 'Could not delete the specified user'});
                        };
                    })
                    } else {
                        callback(400, {'Error' : 'Could not find the specified user'});
                    };
                });
            } else {
                callback(403, {'Error' : 'Missing required token in header or token is invalid'})
            }
        });
    } else {
        callback(400, {'Error' :  'Missing required field'});
    }
}
//Tokens Handler
handlers.tokens = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    };
};

//Token methods container
handlers._tokens = {};

//Tokens - POST
//Required data: phone, password
//Optional data: none
handlers._tokens.post = (data, callback) => {
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if (phone && password) {
        //Match the phone number to the user associated with it 
        _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
                //Hash the sent password and compare it to the password stored in the user object
                const hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    //Create a new token with a random name
                    //Set expiration date 1 hour in the future
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        'phone' : phone,
                        'id' : tokenId,
                        'expires' : expires
                    };

                    //Store the token
                    _data.create('tokens', tokenId, tokenObject, err => {
                        if(!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error' : 'Could not create the new token'});
                        };
                    });
                } else {
                    callback(400, {'Error' : 'Password did not match the specified users stored password'})
                }
            } else {
                callback(400, {'Error' : 'Could not find the specified user'})
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required fields'})
    }
}

//Tokens - GET 
//Required Data: id
//Optional Data: none
handlers._tokens.get = (data, callback) => {
    //Check that the id is valid
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        //Look up the token
        _data.read('tokens', id, (err, tokenData) => {
            if(!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    }else {
        callback(400, {'Error' :  'Missing required field'});
    }
}
//Tokens - PUT 
//Required Data: id, expiration extension (extend)
//Optional Data: none
handlers._tokens.put = (data, callback) => {
    //Validate the id and extend payload
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if (id && extend) {
        //Lookup the token
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                //Check that the token isn't already expired
                if (tokenData.expires > Date.now()) {
                    //Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    //Store the new updates
                    _data.update('tokens', id , tokenData, err => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error' : `Could not update the token's expiration`});
                        }
                    })
                } else {
                    callback(400, {'Error' : 'The token has already expired, and cannot be extended'})
                }
            } else {
                callback(400, {'Error' : 'Specified token does not exist'});
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required field(s) or field(s) are invalid'})
    }
}
//Tokens - DELETE
//Required data: id
//Optional data: none
handlers._tokens.delete = (data, callback) => {
     //Validate the token id
     const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
     if (id) {
         //Look up the user
         _data.read('tokens', id, (err, data) => {
             if(!err && data) {
               _data.delete('tokens', id, err => {
                   if (!err) {
                       callback(200);
                   } else {
                       callback(500, {'Error' : 'Could not delete the specified token'});
                   };
               })
             } else {
                 callback(400, {'Error' : 'Could not find the specified token'});
             };
         });
     }else {
         callback(400, {'Error' :  'Missing required field'});
     }
}

//Verify if a given token id is currently valid for a given user 
handlers._tokens.verifyToken = (id, phone, callback) => {
    //Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
        if(!err && tokenData) {
            //Check that the token is associated with the given user and hasn't expired
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    })
}

//Checks Service
handlers.checks = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405)
    }
}
//Container for all of the checks methods
handlers._checks = {};

//Checks - post
//Required data: protocol(http or https), url, method, successCodes, timeoutSeconds
//Optional data: none
handlers._checks.post = (data, callback) => {
    //Validate protocol, url, method, successCodes, timeoutSeconds
    const protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        //Get the token from the headers
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        //Lookup the user by reading the token
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                const userPhone = tokenData.phone;

                //Lookup the user data
                _data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {
                        const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                        //Verify that the user has less than the number of maximum-checks-per-user
                        if (userChecks.length < config.maxChecks) {
                            //Create a random id for the check 
                            const checkId = helpers.createRandomString(20);

                            //Create the check object and include the user's phone number
                            const checkObject = {
                                'id' : checkId,
                                'userPhone' : userPhone,
                                'protocol' : protocol,
                                'url' : url, 
                                'method' : method,
                                'successCodes' : successCodes,
                                'timeoutSeconds' : timeoutSeconds
                            }

                            //Save the object 
                            _data.create('checks', checkId, checkObject, err => {
                                if (!err) {
                                    //Add the check id to the user's object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    //Save the new user data
                                    _data.update('users', userPhone, userData, err => {
                                        if (!err) {
                                            //Return the data about the new check
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, {'Error' : 'Could not update the user with the new check'});
                                        }
                                    })
                                } else {
                                    callback(500, {'Error' : 'Could not create the new check'});
                                }
                            })
                        } else {
                            callback(400, {'Error' : `User already has the maximum number of checks (${config.maxChecks})`});
                        }
                    } else {
                        callback(403)
                    }
                })
            } else {
                callback(403)
            }
        })
    } else {
        callback(400, {'Error' : 'Missing required inputs or inputs are invalid'});
    }
}

//Checks - get 
//Required data: id,
//Optional data: none
handlers._checks.get = (data, callback) => {
    //Validate the check id
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        //Lookup the check
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                //Get the Token from the Headers
                const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

                //Verify that the given token is valid
                //Verify that the given token belongs to the user who created the check
                handlers._tokens.verifyToken(token, checkData.userPhone, tokenIsValid => {
                    if (tokenIsValid) {
                      //Return the check data
                      callback(200, checkData);
                    } else {
                        callback(403);
                    };
                });
            } else {
                callback(404);
            };
        })
    }else {
        callback(400, {'Error' :  'Missing required field'});
    };
};

//Checks - put
//Required data: id
//Optional data: protocol, url, method, successCodes, timeoutSeconds (One must be selected)
handlers._checks.put = (data, callback) => {
    //Check for required fields
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    //Validate id
    if (id) {
        //Check to make sure one or more of the optional fields has been filled
        if (protocol || url || method || successCodes || timeoutSeconds) {
            //Lookup the check 
            _data.read('checks', id, (err, checkData) => {
                if (!err && checkData) {
                    //Get the Token from the Headers
                    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

                    //Verify that the given token is valid
                    //Verify that the given token belongs to the user who created the check
                    handlers._tokens.verifyToken(token, checkData.userPhone, tokenIsValid => {
                        if (tokenIsValid) {
                            //Update the check where necessary
                            if (protocol) {
                                checkData.protocol = protocol;
                            }
                            if (url) {
                                checkData.url = url;
                            }
                            if (method) {
                                checkData.method = method;
                            }
                            if (successCodes) {
                                checkData.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds;
                            }

                            //Store the new updates 
                            _data.update('checks', id, checkData, err => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, {'Error' : 'Could not update the check'});
                                }
                            })
                        } else {
                           callback(403)
                        };
                    });
                } else {
                    callback(400, {'Error' : 'Check ID does not exist'});
                };
            });
        } else {
            callback(400, {'Error' : 'Missing fields to update'});
        };
    } else {
        callback(400, {'Error' : 'Missing required field'});
    };
};

//Checks - delete 
//Required data: id
//Optional data: none
handlers._checks.delete = (data, callback) => {
    //Validate the check id
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        //Lookup the check 
        _data.read('checks', id, (err, checkData) => {
            if(!err && checkData) {
            //Get the Token from the Headers
            const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

            //Verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token, checkData.userPhone, tokenIsValid => {
                if (tokenIsValid) {

                    //Delete the check data 
                    _data.delete('checks', id, err => {
                        if (!err) {
                            //Look up the user
                            _data.read('users', checkData.userPhone, (err, userData) => {
                                if(!err && userData) {
                                    
                                    const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                                    //Remove the deleted check from their list of checks
                                    const checkPosition = userChecks.indexOf(id);
                                    if (checkPosition > -1) {
                                        userChecks.splice(checkPosition, 1);
                                        //Resave the user's data
                                        _data.update('users', checkData.userPhone, userData, err => {
                                            if (!err) {
                                                callback(200);
                                            } else {
                                                callback(500, {'Error' : 'Could not update the user'});
                                            };
                                        });
                                    } else {
                                        callback(500, {'Error' : `Could not find the check on the user's object. Could not remove check`})
                                    };
                                } else {
                                    callback(500, {'Error' : 'Could not find the user who created the check. Could not remove the check from the list of checks on the user object'});
                                };
                            });
                        } else {
                            callback(500, {'Error' : 'Could not delete the check data'})
                        };
                    });
            } else {
                callback(403, {'Error' : 'Missing required token in header or token is invalid'})
            };
        });
            } else {
                callback(400, {'Error' : 'The specified check ID does not exist'})
            };
        });
    } else {
        callback(400, {'Error' :  'Missing required field'});
    };
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