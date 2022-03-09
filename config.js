/*
*Create and Export Configuration Variables
*
*/

//Container for all the Environments

const environments = {};

//Staging Environment (default)
environments.staging = {
    'port' : 3000,
    'envName' : 'staging'
};

//Production Environment
environments.production = {
    'port' : 5000,
    'envName' : 'production'
};

//Determine which Environment was passed as a Command-Line Argument
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//Check that the Current Environment is one of the Environments that we've defined
//If not, default to 'staging' Environment
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

//Export the module
module.exports = environmentToExport;