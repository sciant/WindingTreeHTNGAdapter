# Summary

This service, developed by Sciant AD, and provided "as-is"  is intended to be used by hotel software systems 
(PMS, Channel Managers, etc.) who want to publish availability, rates and inventory (ARI) to the WindingTree platform, 
and already have a working HTNG ARI push capability in their systems.  

The idea is that the hotel software system can deploy this service to sit between their HTNG service and the WindingTree
service, and allow this service to convert the messages back and forth between the respective formats, allowing for a 
low barrier to entry to working with the WindingTree platform.

Once the WindingTree booking delivery API becomes stable, this project may be extended to support Booking use cases as well.

Copyright &copy; 2019 [Sciant AD](http://www.sciant.com)

> Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
>
> http://www.apache.org/licenses/LICENSE-2.0
>
>   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.


# WindingTreeHTNGAdapter

A SOAP service wiritten in node.js that can convert HTNG format `OTA_HotelAvailNotifRQ` and `OTA_HotelRatePlanNotifRQ` (ARI) requests to WindingTree ARI format.

## Usage

Install all the dependencies in the project directory:

```bash
npm install
```

Secondly, run this command to run the tests(it will take around 15-20 seconds and you need to run the server beforehand) but fill `config/api_urls.json`:

```bash
npm start
npm test
```

Now you should run the integration tests

```
npm run test_integration
``` 

Finally, if no problems were accounted run this command to run start the server(again it will take around 15 seconds):

```bash
npm start
```

Now you understand how the package works! :tada:

## Configuration

The service needs some configurations to run properly.
1. Insert access key and wallet password in `auth.json`
2. Update `hotel_addresses.json` file with addressess of hotels and their codes. 
3. Edit `/htng/services/HTNG_ARIAndReservationPushService.wsdl` and update location attribute to your local service location

## Supports

wt-write-api: v.0.15.1
wt-read-api: v.0.13.4

## Other documentation
[Developers guide](docs/developers_guide.md)

[RatePlanNotifRQ supported fields](docs/supported_elements_rate_plan_notif.md)

[AvailNotifRQ supported fields](docs/supported_elements_avail_notif.md)

