/*
 * Copyright 2019 Sciant (https://www.sciant.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const request = require("request");
const {accessKey, walletPassword} = require("./config/auth.json");
const {WRITE_API, READ_API} = require("./config/api_urls.json");

function getHotelRatePlans(address){
    return new Promise((resolve, reject) => {
        var options = {
            url: READ_API + "hotels/" + address + "/ratePlans",
            json: true,
            method: 'get'
        };
        request(options, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>' + '\n' + JSON.stringify(body));
            }
            resolve(body);
        });
    });
}

function getHotelAvailability(address){
    return new Promise((resolve, reject) => {
        var options = {
            url: READ_API + "hotels/" + address + "/availability",
            json: true,
            method: 'get'
        };
        request(options, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>' + '\n' + JSON.stringify(body));
            }
            resolve(body);
        });
    });
}

function patchHotel(address, hotel, accessKeyParam=accessKey, walletPasswordParam=walletPassword){
    return new Promise((resolve, reject) => {
        var options = {
            url: WRITE_API + "hotels/" + address,
            json: true,
            body: hotel,
            method: 'patch',
            headers: {
                'X-Access-Key': accessKeyParam || accessKey,
                'X-Wallet-Password': walletPasswordParam || walletPassword
              }
        };
        request(options, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 204) {
                reject('Invalid status code <' + response.statusCode + '>' + '\n' + JSON.stringify(body));
            }
            resolve(body);
        });
    });
}


function createHotel(hotel, accessKey=accessKey, walletPassword=walletPassword){
    return new Promise((resolve, reject) => {
        var options = {
            url: WRITE_API + "hotels",
            json: true,
            body: hotel,
            method: 'POST',
            headers: {
                'X-Access-Key': accessKey,
                'X-Wallet-Password': walletPassword
              }
        };
        request(options, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 201) {
                reject('Invalid status code <' + response.statusCode + '>' + '\n' + JSON.stringify(body));
            }
            resolve(body);
        });
    });
}

function createDummyAccount(){
    return new Promise((resolve, reject) => {
        var options = {
            url: WRITE_API + "accounts",
            json: true,
            body: require('./config/random_wallet_account_config'),
            method: 'POST'
        };
        request(options, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 201) {
                reject('Invalid status code <' + response.statusCode + '>' + '\n' + JSON.stringify(body));
            }
            resolve(body);
        });
    });
}

module.exports.getHotelRatePlans = getHotelRatePlans;
module.exports.getHotelAvailability = getHotelAvailability;
module.exports.patchHotel = patchHotel;
module.exports.createHotel = createHotel;
module.exports.createDummyAccount = createDummyAccount;