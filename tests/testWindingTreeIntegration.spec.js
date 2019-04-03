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

var fs = require('fs');
var path = require('path');

var {createHotel, createDummyAccount, getHotelRatePlans, getHotelAvailability, patchHotel} = require('../windingtreecon');

var account = {}
var hotelAddress = ""

describe('Rate plans testing', () => {
    beforeAll((cb) => {
      jest.setTimeout(60000);
        createDummyAccount().then(function(value) {
            console.log("Dummy account created: ")
            console.log(value)
            account = value
            createHotel(require('../config/random_hotel'), accessKey=value.accessKey, walletPassword="windingtree").then(function(h){
                console.log("Dummy hotel created: ")
                console.log(h.address)
                hotelAddress = h.address
                cb()
            }).catch((e) => {console.error("Error while creating hotel: "+ e)})
        }).catch((e) => {console.error("Error while creating account: "+ e)})
    })
    test("Test get set rate plans", (cb) => {
      expect.assertions(1);
      if(hotelAddress == "")cb()
      let state = JSON.parse(fs.readFileSync(path.join(__dirname,'test_cases/new_rate_plan.json'), 'utf8'));
      patchHotel(hotelAddress, state, account.accessKey, "windingtree").then((() => {
        getHotelRatePlans(hotelAddress).then((result) => {
          expect(result.items).toEqual(state["ratePlans"])
          cb()
        }).catch((err) => {
          console.error("Error while reading hotel rate plans: " + err)
          cb()
        })
      })).catch((err) => {
        console.error("Error while updating hotel: " + err)
        cb()
      })      
    }, 600000);

    test("Test get set availability", (cb) => {
      expect.assertions(1);
      if(hotelAddress == "")cb()
      let state = JSON.parse(fs.readFileSync(path.join(__dirname,'test_cases/update_roomtype_availability.json'), 'utf8'));
      patchHotel(hotelAddress, state, account.accessKey, "windingtree").then((() => {
        getHotelAvailability(hotelAddress).then((result) => {
          expect(result.items).toEqual(state["availability"]["roomTypes"])
          cb()
        }).catch((err) => {
          console.error("Error while reading hotel availability: " + err)
          cb()
        })
      })).catch((err) => {
        console.error("Error while updating hotel: " + err)
        cb()
      })      
    }, 60000);
  }
)