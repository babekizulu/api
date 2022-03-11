/*
* Library for storing and editing data 
*
*/

//Dependencies
const fs = require('fs');
const path = require('path');

//Create a container for the data module that we're creating 
//(Will be exported)
const lib = {};

//Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

//Write data to a file 
lib.create = (dir, file, data, callback) => {
    //Open the file for writing
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            //Convert data to string
            const stringData = JSON.stringify(data);

            //Write to file and close it 
            fs.writeFile(fileDescriptor, stringData, err => {
                if (!err) {
                    fs.close(fileDescriptor, err => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error: Could not close new File');
                        }
                    })
                } else {
                    callback('Error: Could not write to new file');
                }
            })
        } else {
            callback('Error: Could not create new file. It may already exist');
        }
    });
}

//Read data from a file 
lib.read = (dir, file, callback) => {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf-8', (err, data) => {
        callback(err, data);
    });
}

//Update data of an existing file
lib.update = (dir, file, data, callback) => {
    //Open the file for writing
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            //Convert data to a string 
            const stringData = JSON.stringify(data);

            //Truncate the file
            fs.ftruncate(fileDescriptor, err => {
                if (!err) {
                    //Write to file and close it
                    fs.writeFile(fileDescriptor, stringData, err => {
                        if (!err) {
                            fs.close(fileDescriptor, err => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error: Could not close file');
                                };
                            });
                        } else {
                            callback('Error: Could not update file');
                        };
                    });
                } else {
                    callback('Error: Could not truncate file');
                };
            });
        } else {
            callback('Error: Could not open the file for updating. It may not exist yet');
        };
    });
}

//Delete a file
lib.delete = (dir, file, callback) => {
    //Unlink the file from the file system
    fs.unlink(`${lib.baseDir}${dir}/${file}.json`, err => {
        if (!err) {
            callback(false);
        } else {
            callback('Error: Could not delete file');
        }
    })
}

//Export Module
module.exports = lib;
