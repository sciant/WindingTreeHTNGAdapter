# Developers guide
The project consists of four components.

## Translation
This component exports one function which gets the current state and the request and returns new state that we should submit.

## Windingtree connection
Consists of functions we use to get/update data from/to Windingtree API.

## Service
We use node-soap as soap service library. When we receive new request we pass the decoded body to the translation component. After we have the result we use the windingtree connection component to update the data in the storage.

## Tests
The tests use node-soap library to transform the requested XML into JS object using the service definition. Then they test if hardcoded requests and responses are result of the translation component.