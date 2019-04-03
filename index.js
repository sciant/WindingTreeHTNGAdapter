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

const soap = require('soap')
const express = require('express')
const {ratePlanNotifController, availNotifController} = require('./controllers')
const PORT = process.env.PORT || 7000
const ROUTE = process.env.ROUTE || "/wsdl"


var service = {
    HTNG_ARIAndReservationPushService: {
        ARIAndReservationPush: {
            OTA_HotelRatePlanNotifRQ: function(args, callback) {
                ratePlanNotifController(args).then((r) => {
                    callback(r)
                }).catch((e) => console.error(e))
            },            
            OTA_HotelAvailNotifRQ: function(args, callback) {
                availNotifController(args).then((r) => {
                    callback(r)
                }).catch((e) => console.error(e)) 
            },

        }
    }
};

var xml = require('fs').readFileSync(require('path').resolve(__dirname, 'htng/services/HTNG_ARIAndReservationPushService.wsdl'), 'utf8');


var app = express();
app.use("/wsdls", express.static('htng/wsdls'))
app.use("/services", express.static('htng/services'))
app.use("/opentravel", express.static('htng/opentravel'))
app.use("/messages", express.static('htng/messages'))
app.use("/schemas", express.static('htng/schemas'))

app.listen(PORT, function(){
    soap.listen(app, {
        path: ROUTE,
        services: service,
        xml: xml,
        attributesKey: "$"
    });
});
