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

/**
 * Gets current state and string representing xml notification and returns new state after the update
 * @param {object} state 
 * @param {string} xml 
 * @returns {Promise}
 */
function execute(state, xml, msg) {
    // If We are executing Rate Plan Notification request:
    if (msg == "OTA_HotelRatePlanNotifRQ") {
        let newState = _deepCopyArray(state)
        let timestamp = xml.$.TimeStamp;
        let rateplans = xml.RatePlans.RatePlan;

        for (let i = 0; i < rateplans.length; i++) {
            if (rateplans[i].$.RatePlanNotifType == "New") {
                if(_ratePlanExists(state, rateplans[i].$.RatePlanCode + "0")) {
                    throw "Rate plan already exists";
                }
                newState = executeNewRatePlanNotif(rateplans[i], _deepCopyArray(newState), timestamp);
            } else if (rateplans[i].$.RatePlanNotifType == "Remove") {
                if(!_ratePlanExists(state, rateplans[i].$.RatePlanCode + "0")) {
                    throw "Rate plan doesn't exists";
                }
                newState = executeRemoveRatePlanNotif(rateplans[i], _deepCopyArray(newState))

            } else if (rateplans[i].$.RatePlanNotifType == "Delta") {
                if(!_ratePlanExists(state, rateplans[i].$.RatePlanCode + "0")) {
                    throw "Rate plan doesn't exists";
                }
                newState = executeDeltaRatePlanNotif(rateplans[i], _deepCopyArray(newState), timestamp);
            } else if (rateplans[i].$.RatePlanNotifType == "Overlay") {
                if(!_ratePlanExists(state, rateplans[i].$.RatePlanCode + "0")) {
                    throw "Rate plan doesn't exists";
                }
                newState = executeOverlayRatePlanNotif(rateplans[i], _deepCopyArray(newState), timestamp);
            }
        }
        return ({
            ratePlans: newState
        });
    } else // Or if we are executing Availability Notification request:
    {
        let newState = Object.assign({}, state)
        let timestamp = xml.$.TimeStamp;
        let availStatusMessages = xml.AvailStatusMessages.AvailStatusMessage;

        for (let i = 0; i < availStatusMessages.length; i++) {
            newState = executeAvailStatusMessageNotif(availStatusMessages[i], Object.assign({}, newState), timestamp);
        }
        return ({
            availability:  newState
        });
    }

}

/**
 * Executes room type availability message and returns the result
 * @param {object} rate_plan 
 * @param {object} state
 * @returns {object}
 */
function executeAvailStatusMessageNotif(availStatusMessage, state, timestamp) {
    let restrictions = {};
    let restrictionStatuses = availStatusMessage.RestrictionStatus;
    if(!Array.isArray(restrictionStatuses))restrictionStatuses = [restrictionStatuses];
    for (let i = 0; i < restrictionStatuses.length; i++) {
        if (restrictionStatuses[i].$.Restriction == "Arrival") {
            restrictions.noArrival = restrictionStatuses[i].$.Status == "Open" ? false : restrictionStatuses[i].$.Status == "Close" ? true : undefined;
        }
        if (restrictionStatuses[i].$.Restriction == "Departure") {
            restrictions.noDeparture = restrictionStatuses[i].$.Status == "Open" ? false : restrictionStatuses[i].$.Status == "Close" ? true : undefined;
        }
    }
    if (availStatusMessage.$.BookingLimit) {
        var bookingLimit = parseInt(availStatusMessage.$.BookingLimit);
    }
    let bookingLimitMessageType = availStatusMessage.$.BookingLimitMessageType;
    state.updatedAt = timestamp;
    let statusAppControls = availStatusMessage.StatusApplicationControl;
    if(!Array.isArray(statusAppControls))statusAppControls = [statusAppControls];
    for (let i = 0; i < statusAppControls.length; i++) {
        let start = statusAppControls[i].$.Start;
        let end = statusAppControls[i].$.End;
        let week = [Number(statusAppControls[i].$.Sun), Number(statusAppControls[i].$.Mon), Number(statusAppControls[i].$.Tue), Number(statusAppControls[i].$.Weds),
            Number(statusAppControls[i].$.Thur), Number(statusAppControls[i].$.Fri), Number(statusAppControls[i].$.Sat)
        ];
        let room = statusAppControls[i].$.InvTypeCode;
        let listOfRoomTypeAvails = []
        for(let i=0;i<state.roomTypes.length;i++){
            //console.log(state.roomTypes[i])
            if(state.roomTypes[i].roomTypeId == room) listOfRoomTypeAvails.push(state.roomTypes[i])
        }
        //console.log(listOfRoomTypeAvails)
        updateAvailabilityList(listOfRoomTypeAvails, start, end, week, bookingLimit, bookingLimitMessageType, restrictions, room, state.roomTypes);
    }

    return state;
}

/**
 * Updates availability list
 * @param {array} availability 
 * @param {string} start 
 * @param {string} end 
 * @param {array} week Array storing for every day of week if the message applies to it
 * @param {number} bookingLimit 
 * @param {string} roomType 
 * @param {object} roomTypesReference
 * @param {string} bookingLimitMessageType 
 */
function updateAvailabilityList(availability, start, end, week, bookingLimit, bookingLimitMessageType, restrictions, roomType, roomTypesReference) {
    let endDate = new Date(end);
    let datesToBeChanged = [];
    let noArrival = restrictions.noArrival,
        noDeparture = restrictions.noDeparture;

    for (let d = new Date(start); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (week[new Date(d).getDay()] == "0") continue;
        datesToBeChanged.push(new Date(d));
    }
    datesToBeChanged = datesToBeChanged.map(Number);
    for (let i = 0; i < availability.length; i++) {
        availability[i].date = availability[i].date.slice(0, 10);
        dateIndex = datesToBeChanged.indexOf(Number(new Date(availability[i].date)));
        if (dateIndex == -1) continue;
        if (bookingLimitMessageType == "SetLimit") {
            availability[i].quantity = bookingLimit;
        }
        if (bookingLimitMessageType == "AdjustLimit") {
            availability[i].quantity += bookingLimit;
        }
        if (bookingLimitMessageType == "RemoveLimit") {
            availability[i].quantity = 0;
        }
        if(availability[i].restrictions == null && (noArrival || noDeparture))availability[i].restrictions = {};
        if(typeof noArrival === "boolean")availability[i].restrictions.noArrival = noArrival;
        if(typeof noDeparture === "boolean")availability[i].restrictions.noDeparture = noDeparture;
        datesToBeChanged.splice(dateIndex, 1);
    }
    for (let i = 0; i < datesToBeChanged.length; i++) {
        roomTypesReference.push({
            date: new Date(datesToBeChanged[i]).toISOString().slice(0, 10),
            quantity: bookingLimit ? bookingLimit : 0,
            restrictions,
            roomTypeId: roomType
        });
    }
}

/**
 * Executes rate plan message with RatePlanNotifType = "Remove" and returns the result
 * @param {object} rate_plan 
 * @param {object} state
 * @returns {object}
 */
function executeRemoveRatePlanNotif(rate_plan, state) {
    let rateIndex = 0;
    while(_removeRateFromList(state, rate_plan.$.RatePlanCode + rateIndex.toString())) rateIndex++;
    return state;
}

/**
 * Executes rate plan message with RatePlanNotifType = "Overlay" and returns the result
 * @param {object} rate_plan 
 * @param {object} state
 * @returns {object}
 */
function executeOverlayRatePlanNotif(rate_plan, state, timestamp) {
    let removedFromState = executeRemoveRatePlanNotif(rate_plan, state);
    return executeNewRatePlanNotif(rate_plan, removedFromState, timestamp);

}

/**
 * Executes rate plan message with RatePlanNotifType = "Delta" and returns the result. You should provide timestamp that will fill updatedAt field
 * @param {object} rate_plan 
 * @param {object} state
 * @param {string} timestamp
 * @returns {object}
 */
function executeDeltaRatePlanNotif(rate_plan, state, timestamp) {
    let ratePlanCode = rate_plan.$.RatePlanCode;
    if (rate_plan.BookingRules) {
        var bookingRules = rate_plan.BookingRules.BookingRule;
        if(bookingRules.length == null)bookingRules = [bookingRules];
    }
    let rates = rate_plan.Rates.Rate;
    if(rates.length == null)rates = [rates];
    
    for (let i = 0; i < rates.length; i++) {
        let start = rates[i].$.Start;
        let end = rates[i].$.End;
        let roomTypeId = rates[i].$.InvTypeCode;
        let rateIndex = 0;
        let indexInstate = _findRateInList(state, ratePlanCode + rateIndex.toString())
        while (indexInstate != null) {
            let isThatTheRightRatePlan = true;
            isThatTheRightRatePlan &= state[indexInstate].roomTypeIds.includes(roomTypeId); // We want to update rate plan for only that room
            isThatTheRightRatePlan &= state[indexInstate].availableForTravel.from == start; // We want to update only that dates
            isThatTheRightRatePlan &= state[indexInstate].availableForTravel.to == end;
            if (isThatTheRightRatePlan) {
                insertRateInfo(rates[i], state[indexInstate]);
                if (bookingRules) {
                    insertRestrictions(bookingRules, state[indexInstate].restrictions);
                }
                state[indexInstate].updatedAt = timestamp + "Z";
            }
            rateIndex++;
            indexInstate = _findRateInList(state, ratePlanCode + rateIndex.toString())
        }
    }
    return state;

}

/**
 * Executes rate plan message with RatePlanNotifType = "New" and returns the result. You should provide timestamp that will fill updatedAt field
 * @param {object} rate _plan 
 * @param {object} state
 * @param {string} timestamp
 * @returns {object}
 */
function executeNewRatePlanNotif(rate_plan, state, timestamp) {
    let ratePlanCode = rate_plan.$.RatePlanCode;
    let descriptions = rate_plan.Description
    if(!Array.isArray(descriptions))descriptions = [descriptions];
    let short_description = "";
    let long_description = "";
    for (let i = 0; i < descriptions.length; i++) {
        if (descriptions[i].$.Name == "Short description") {
            short_description = descriptions[i].Text;
        }
        if (descriptions[i].$.Name == "Long description") {
            long_description = descriptions[i].Text;
        }
    }

    let restrictions = {
        lengthOfStay: {}
    };
    // Set restrictions
    if (rate_plan.BookingRules) {
        var bookingRules = rate_plan.BookingRules.BookingRule;
        if(bookingRules.length == null)bookingRules = [bookingRules];

        insertRestrictions(bookingRules, restrictions);
    }
    // Set rate and modifiers
    rates = rate_plan.Rates.Rate
    if(rates.length == null)rates = [rates];

    let rateIndex = 0;
    for (let i = 0; i < rates.length; i++) {
        let newRatePlan = {};
        insertRateInfo(rates[i], newRatePlan);
        newRatePlan.name = short_description;
        newRatePlan.description = long_description;
        newRatePlan.updatedAt = timestamp + "Z";
        newRatePlan.restrictions = restrictions;
        newRatePlan.id = ratePlanCode + rateIndex.toString(); 
        state.push(newRatePlan)
        rateIndex++;
    }
    return state;
}

/**
 * Updates restriction object by given booking rules
 * @param {array} bookingRules 
 * @param {object} restrictions
 */
function insertRestrictions(bookingRules, restrictions) {
    for (let i = 0; i < bookingRules.length; i++) {
        if (bookingRules[i].LengthsOfStay) {
            var lengthsOfStay = bookingRules[i].LengthsOfStay.LengthOfStay;
            if(lengthsOfStay.length == null)lengthsOfStay = [lengthsOfStay];
    
            for (let j = 0; j < lengthsOfStay.length; j++) {
                let timeUnitMultiplier = lengthsOfStay[j].$.TimeUnit == "Day" ? 1 : lengthsOfStay[j].$.TimeUnit == "Week" ? 7 : 30;
                if (lengthsOfStay[j].$.MinMaxMessageType == "SetMinLOS" || lengthsOfStay[j].$.MinMaxMessageType == "MinLOS") {
                    restrictions.lengthOfStay.min = Number(lengthsOfStay[j].$.Time) * timeUnitMultiplier;
                }
                if (lengthsOfStay[j].$.MinMaxMessageType == "SetMaxLOS" || lengthsOfStay[j].$.MinMaxMessageType == "MaxLOS") {
                    restrictions.lengthOfStay.max = Number(lengthsOfStay[j].$.Time) * timeUnitMultiplier;
                }
                if (lengthsOfStay[j].$.MinMaxMessageType == "SetFixedLOS") {
                    restrictions.lengthOfStay.max = Number(lengthsOfStay[j].$.Time) * timeUnitMultiplier;
                    restrictions.lengthOfStay.min = Number(lengthsOfStay[j].$.Time) * timeUnitMultiplier;
                }
                if (lengthsOfStay[j].$.MinMaxMessageType == "RemoveMinLOS") {
                    delete restrictions.lengthOfStay.min;
                }
                if (lengthsOfStay[j].$.MinMaxMessageType == "RemoveMaxLOS") {
                    delete restrictions.lengthOfStay.max;
                }
            }
        }
    }
}

/**
 * Updates winding tree rate plan object by given rate
 * @param {array} rate 
 * @param {object} rate_plan
 */
function insertRateInfo(rate, rate_plan) {
    rate_plan.availableForTravel = {};
    rate_plan.roomTypeIds = [];
    rate_plan.roomTypeIds.push(rate.$.InvTypeCode);
    rate_plan.availableForTravel.from = rate.$.Start;
    rate_plan.availableForTravel.to = rate.$.End;
    if (rate.$.CurrencyCode) rate_plan.currency = rate.$.CurrencyCode;
    let basePrice = 0;
    let baseAmounts = rate.BaseByGuestAmts.BaseByGuestAmt;
    if(baseAmounts.length == null)baseAmounts = [baseAmounts];
    
    let modifiers = [];
    for (let i = 0; i < baseAmounts.length; i++) {
        if (baseAmounts[i].$.NumberOfGuests == "1") {
            basePrice = parseFloat(
                baseAmounts[i].$.AmountBeforeTax
            ) / parseFloat(
                baseAmounts[i].$.NumberOfGuests
            )
            continue;
        }
        pricePerGuest = parseFloat(
            baseAmounts[i].$.AmountBeforeTax
        ) / parseFloat(
            baseAmounts[i].$.NumberOfGuests
        );
        modifiers.push({
            adjustment: 100 * (pricePerGuest - basePrice) / basePrice,
            conditions: {
                from: rate_plan.availableForTravel.from,
                to: rate_plan.availableForTravel.to,
                minOccupants: parseInt(baseAmounts[i].$.NumberOfGuests)
            }
        })
    }
    if (rate.AdditionalGuestAmounts) {
        additionalGuestAmounts = rate.AdditionalGuestAmounts.AdditionalGuestAmount
        if(additionalGuestAmounts.length == null)additionalGuestAmounts = [additionalGuestAmounts];
        
        insertModifiersForAdditionalGuests(additionalGuestAmounts, basePrice, modifiers, rate_plan.availableForTravel.from, rate_plan.availableForTravel.to);
    }
    rate_plan.price = basePrice;
    rate_plan.modifiers = modifiers;
}

/**
 * Updates modifiers object by given additional guest amounts
 * @param {array} additional_guest_amounts
 * @param {number} base_price Current base price
 * @param {object} modifiers
 * @param {object} start The start date of the rate
 * @param {object} end The end date of the rate
 */
// TODO: Better age conditions
function insertModifiersForAdditionalGuests(additional_guest_amounts, base_price, modifiers, start, end) {
    // If the room is for one man
    let lastAdjustment = 0;
    let lastNOG = 1; //  Else:
    if (modifiers.length > 0) {
        let lastModifier = modifiers[modifiers.length - 1];
        lastAdjustment = lastModifier.adjustment;
        // Get number of guests aka minOccupants
        lastNOG = lastModifier.conditions.minOccupants;
    }
    for (let i = 0; i < additional_guest_amounts.length; i++) {
        let maxAge = -1;
        if (additional_guest_amounts[i].$.AgeQualifyingCode == "3") maxAge = 2;
        if (additional_guest_amounts[i].$.AgeQualifyingCode == "4") maxAge = 12;
        if (additional_guest_amounts[i].$.AgeQualifyingCode == "5") maxAge = 17;
        if (additional_guest_amounts[i].$.AgeQualifyingCode == "6") maxAge = 21;
        if (additional_guest_amounts[i].$.AgeQualifyingCode == "8") maxAge = 12;
        if (additional_guest_amounts[i].$.AgeQualifyingCode == "10") maxAge = -1;
        let modifier = {
            conditions: {}
        };
        let oldPricePerGuest = lastAdjustment / 100 * base_price + base_price;
        let newPricePerGuest = (oldPricePerGuest * lastNOG + parseFloat(additional_guest_amounts[i].$.Amount)) / (lastNOG + 1);
        modifier.adjustment = 100 * (newPricePerGuest - base_price) / base_price;
        modifier.conditions.minOccupants = lastNOG + 1;
        modifier.conditions.from = start;
        modifier.conditions.to = end;
        if (maxAge != -1) modifier.conditions.maxAge = maxAge;
        modifiers.push(modifier);
    }
}

function _removeRateFromList(state, rate){
    for(let i=0;i<state.length;i++){
        if(state[i].id == rate){
            state.splice(i, i+1)
            return true
        }
    }
    return false
}

function _findRateInList(state, rate){
    for(let i=0;i<state.length;i++){
        if(state[i].id == rate){
            return i
        }
    }
    return null
}

function _ratePlanExists(ratePlanList, id){
    for(let i=0; i<ratePlanList.length; i++){
        if(ratePlanList[i].id == id) return true;
    }
    return false;
}

function _deepCopyArray(state){
    return state.map(a => Object.assign({}, a))
}

module.exports.execute = execute;