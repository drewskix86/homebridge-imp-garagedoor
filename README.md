# homebridge-imp-garagedoor
[Homebridge](https://github.com/nfarina/homebridge) plugin that supports triggering commands to check state, open, and close a garage door.

## Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-imp-garagedoor`
3. Update your configuration file. See `sample-config.json` in this repository for a sample.

## Configuration

Configuration sample:

```json
"accessories": [
  {
    "accessory": "GarageDoorImp",
    "name": "Garage Door",
    "url": "https://agent.electricimp.com/Homf6N8jHm9F",
    "sharedKey": "asdfghjklpoiuytrewqASDFGHJKL0987",
    "status_update_delay": 15
  }
]

```
## Explanation:

Field                   | Description
------------------------|------------
**accessory**           | Must always be "GarageDoorImp". (required)
**name**                | Name of the Garage Door
**url**                 | url to respond to msg=check|open|close (required)
**sharedKey**           | 32 character alphanumeric shared key (url?apiKey=sharedKey&msg=check|open|close
**status_update_delay** | Time to delay updating state to ensure state updated (defaults to 15 seconds)

The open, close, and state commands should return an encoded json object with 2 values with the keys "current" and "target". Accepted current values are: OPEN, CLOSED, OPENING, CLOSING, STOPPED
Accepted target values are: OPEN, CLOSED
Assembled secure URL should resemble: https://the-url.com?apiKey=qwertyASDFGHzxcvbnPLkm0123456789&msg=check
