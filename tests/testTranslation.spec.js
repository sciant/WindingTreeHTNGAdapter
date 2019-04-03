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
var soap = require('soap')

var {execute} = require('../translate');
const {validateRatePlanNotifMessage, validateAvailNotifMessage} = require('../validator');

var WSDL = {}

describe('Rate plans testing', () => {
    beforeAll((cb) => {
      jest.setTimeout(30000);
      var xml = fs.readFileSync(path.join(__dirname,'../htng/services/HTNG_ARIAndReservationPushService.wsdl'), 'utf8');
      var wsdl = new soap.WSDL(xml, "", {        
        path: '/wsdl',
        xml: xml
      })
      wsdl.options.attributesKey = "$"
      WSDL = wsdl
      wsdl.onReady((err) => {
        if(err) throw err
        cb()
      })
    })
    test("Test rate plan addition", () => {
      let state = JSON.parse(fs.readFileSync(path.join(__dirname,'test_cases/rate_plans_state.json'), 'utf8'));
      let input = fs.readFileSync(path.join(__dirname,'test_cases/new_rate_plan.xml'), 'utf8');
      let result = JSON.parse(fs.readFileSync(path.join(__dirname,'test_cases/new_rate_plan.json'), 'utf8'));
      expect.assertions(1);
      let inputXML = WSDL.xmlToObject(input)
      expect(execute(state, inputXML.Body.OTA_HotelRatePlanNotifRQ, "OTA_HotelRatePlanNotifRQ")).toEqual(result);
    });
    test("Test rate plan removing", () => {
      let state = JSON.parse(fs.readFileSync(path.join(__dirname,'test_cases/rate_plans_state.json'), 'utf8'));
      let input = fs.readFileSync(path.join(__dirname,'test_cases/remove_rate_plan.xml'), 'utf8');
      let result = JSON.parse(fs.readFileSync(path.join(__dirname,'test_cases/remove_rate_plan.json'), 'utf8'));
      expect.assertions(1);
      let inputXML = WSDL.xmlToObject(input)
      expect(execute(state, inputXML.Body.OTA_HotelRatePlanNotifRQ, "OTA_HotelRatePlanNotifRQ")).toEqual(result);
    });
    test("Test rate plan overlaying", () => {
      let state = JSON.parse(fs.readFileSync(path.join(__dirname,'test_cases/rate_plans_state.json'), 'utf8'));
      let input = fs.readFileSync(path.join(__dirname,'test_cases/overlay_rate_plan.xml'), 'utf8');
      let result = JSON.parse(fs.readFileSync(path.join(__dirname,'test_cases/overlay_rate_plan.json'), 'utf8'));
      expect.assertions(1);
      let inputXML = WSDL.xmlToObject(input)
      expect(execute(state, inputXML.Body.OTA_HotelRatePlanNotifRQ, "OTA_HotelRatePlanNotifRQ")).toEqual(result);
    });
    test("Test rate plan changing", () => {
      let state = JSON.parse(fs.readFileSync(path.join(__dirname,'test_cases/rate_plans_state.json'), 'utf8'));
      let input = fs.readFileSync(path.join(__dirname,'test_cases/delta_rate_plan.xml'), 'utf8');
      let result = JSON.parse(fs.readFileSync(path.join(__dirname,'test_cases/delta_rate_plan.json'), 'utf8'));
      expect.assertions(1);
      let inputXML = WSDL.xmlToObject(input)
      expect(execute(state, inputXML.Body.OTA_HotelRatePlanNotifRQ, "OTA_HotelRatePlanNotifRQ")).toEqual(result);
    });
    test("Test rate plan xml validation", () => {
      let input = fs.readFileSync(path.join(__dirname,'test_cases/validation_rate_plan.xml'), 'utf8');
      let inputXML = WSDL.xmlToObject(input)
      expect.assertions(1);
      expect(validateRatePlanNotifMessage(inputXML.Body.OTA_HotelRatePlanNotifRQ).errors.length).toEqual(1);
    });
  }
)

describe('Availability testing', () => {
  test("Test set limit availability status", () => {
    let state = JSON.parse(fs.readFileSync(path.join(__dirname,'test_cases/availability_state.json'), 'utf8'));
    let input = fs.readFileSync(path.join(__dirname,'test_cases/update_roomtype_availability.xml'), 'utf8');
    let result = JSON.parse(fs.readFileSync(path.join(__dirname,'test_cases/update_roomtype_availability.json'), 'utf8'));
    expect.assertions(1);
    let inputXML = WSDL.xmlToObject(input)
    expect(execute(state, inputXML.Body.OTA_HotelAvailNotifRQ, "OTA_HotelAvailNotifRQ")).toEqual(result);
  });
  test("Test availability xml validation", () => {
    let input = fs.readFileSync(path.join(__dirname,'test_cases/validation_availability.xml'), 'utf8');
    let inputXML = WSDL.xmlToObject(input)
    expect.assertions(1);
    expect(validateAvailNotifMessage(inputXML.Body.OTA_HotelAvailNotifRQ).errors.length).toEqual(1);
  });

}
)