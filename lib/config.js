/*
*Create and Export Configuration Variables
*
*/

//Container for all the Environments

const environments = {};

//Staging Environment (default)
environments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging', 
    'hashingSecret' : 'thisIsASecret'
};

//Production Environment
environments.production = {
    'httpPort': 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret' : 'thisIsASecretToo'
};

//Determine which Environment was passed as a Command-Line Argument
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//Check that the Current Environment is one of the Environments that we've defined
//If not, default to 'staging' Environment
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

//Export the module
module.exports = environmentToExport;