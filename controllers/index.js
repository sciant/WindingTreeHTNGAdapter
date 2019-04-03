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

const {execute} = require('../translate');
const {getHotelRatePlans, getHotelAvailability, patchHotel} = require('../windingtreecon');
const hotelAddresses = require('../config/hotel_addresses');
const {validateRatePlanNotifMessage, validateAvailNotifMessage} = require('../validator');

async function ratePlanNotifController(args){
    let echoToken = args.$.EchoToken;
    let version = args.$.Version;
    warnings = []
    let errors = validateRatePlanNotifMessage(args).errors
    if(errors.length > 0){
        errors.forEach((e) => {
            warnings.push({
                Type: 1,
                ShortText: e.message
            })
        })
    }
    let xmlWarnings = undefined
    if(warnings.length>0){
        xmlWarnings = {
            Warning: warnings
        }
    }
    //Get hotel address from code
    let hotelAddress = args.RatePlans.$.HotelCode;
    if (!hotelAddress.startsWith("0x"))
        hotelAddresses[args.RatePlans.$.HotelCode];
    try{
        let state = await getHotelRatePlans(hotelAddress)
        var resultJson = execute(state, args, "OTA_HotelRatePlanNotifRQ");
        await patchHotel(hotelAddress, resultJson)
    }catch(e){
        console.error(e)
        return _createErrorMessage(echoToken, version)
    }
    return {
        $: {
            EchoToken: echoToken,
            Version: version,
            TimeStamp: new Date().toISOString()
        }, Success: {}, Warnings: xmlWarnings
    }
        
}

async function availNotifController(args){
    let echoToken = args.$.EchoToken;
    let version = args.$.Version;
    let messageContentCode = args.$.MessageContentCode;
    warnings = []
    let errors = validateAvailNotifMessage(args).errors
    if(errors.length > 0){
        errors.forEach((e) => {
            warnings.push({
                Type: 1,
                ShortText: e.message.length<=64?e.message:e.message.substring(0,61)+'...'
            })
        })
    }
    let xmlWarnings = undefined
    if(warnings.length>0){
        xmlWarnings = {
            Warning: warnings
        }
    }
    //Get hotel address from code
    let hotelAddress = args.RatePlans.$.HotelCode;
    if (!hotelAddress.startsWith("0x") && hotelAddress.length == 42)
        hotelAddresses[args.RatePlans.$.HotelCode];
    try{
        let state = await getHotelAvailability(hotelAddress)
        var resultJson = execute(state, args, "OTA_HotelAvailNotifRQ");
        await patchHotel(hotelAddress, resultJson)
    }catch(e){
        console.log(e)
        return _createErrorMessage(echoToken, version, messageContentCode)
    }
    return {
        $: {
            EchoToken: echoToken,
            Version: version,
            TimeStamp: new Date().toISOString()
        }, Success: {}, Warnings: xmlWarnings
    }
}


function _createErrorMessage(echoToken, version, messageContentCode){
    return {
            $: {
                EchoToken: echoToken,
                Version: version,
                TimeStamp: new Date().toISOString(),
                MessageContentCode: messageContentCode
            }, Errors: {
                Error: [{
                    Type: 1
                }]
            }
        }
}

module.exports.availNotifController = availNotifController
module.exports.ratePlanNotifController = ratePlanNotifController