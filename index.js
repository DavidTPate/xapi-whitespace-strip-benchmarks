const Benchmark = require('benchmark');
const suite = new Benchmark.Suite;

const payload = JSON.stringify({
    "id": "6690e6c9-3ef0-4ed3-8b37-7f3964730bee",
    "actor": {
        "name": "Team PB",
        "mbox": "mailto:teampb@example.com",
        "member": [
            {
                "name": "Andrew Downes",
                "account": {
                    "homePage": "http://www.example.com",
                    "name": "13936749"
                },
                "objectType": "Agent"
            },
            {
                "name": "Toby Nichols",
                "openid": "http://toby.openid.example.org/",
                "objectType": "Agent"
            },
            {
                "name": "Ena Hills",
                "mbox_sha1sum": "ebd31e95054c018b10727ccffd2ef2ec3a016ee9",
                "objectType": "Agent"
            }
        ],
        "objectType": "Group"
    },
    "verb": {
        "id": "http://adlnet.gov/expapi/verbs/attended",
        "display": {
            "en-GB": "attended",
            "en-US": "attended"
        }
    },
    "result": {
        "extensions": {
            "http://example.com/profiles/meetings/resultextensions/minuteslocation": "X:\\meetings\\minutes\\examplemeeting.one"
        },
        "success": true,
        "completion": true,
        "response": "We agreed on some example actions.",
        "duration": "PT1H0M0S"
    },
    "context": {
        "registration": "ec531277-b57b-4c15-8d91-d292c5b2b8f7",
        "contextActivities": {
            "parent": [
                {
                    "id": "http://www.example.com/meetings/series/267",
                    "objectType": "Activity"
                }
            ],
            "category": [
                {
                    "id": "http://www.example.com/meetings/categories/teammeeting",
                    "objectType": "Activity",
                    "definition": {
                        "name": {
                            "en": "team meeting"
                        },
                        "description": {
                            "en": "A category of meeting used for regular team meetings."
                        },
                        "type": "http://example.com/expapi/activities/meetingcategory"
                    }
                }
            ],
            "other": [
                {
                    "id": "http://www.example.com/meetings/occurances/34257",
                    "objectType": "Activity"
                },
                {
                    "id": "http://www.example.com/meetings/occurances/3425567",
                    "objectType": "Activity"
                }
            ]
        },
        "instructor": {
            "name": "Andrew Downes",
            "account": {
                "homePage": "http://www.example.com",
                "name": "13936749"
            },
            "objectType": "Agent"
        },
        "team": {
            "name": "Team PB",
            "mbox": "mailto:teampb@example.com",
            "objectType": "Group"
        },
        "platform": "Example virtual meeting software",
        "language": "tlh",
        "statement": {
            "objectType": "StatementRef",
            "id": "6690e6c9-3ef0-4ed3-8b37-7f3964730bee"
        }

    },
    "timestamp": "2013-05-18T05:32:34.804Z",
    "stored": "2013-05-18T05:32:34.804Z",
    "authority": {
        "account": {
            "homePage": "http://butt.scorm.com/",
            "name": "anonymous"
        },
        "objectType": "Agent"
    },
    "version": "1.0.0",
    "object": {
        "id": "http://www.example.com/meetings/occurances/34534",
        "definition": {
            "extensions": {
                "http://example.com/profiles/meetings/activitydefinitionextensions/room": {
                    "name": "Kilby",
                    "id": "http://example.com/rooms/342"
                }
            },
            "name": {
                "en-GB": "example meeting",
                "en-US": "example meeting"
            },
            "description": {
                "en-GB": "An example meeting that happened on a specific occasion with certain people present.",
                "en-US": "An example meeting that happened on a specific occasion with certain people present."
            },
            "type": "http://adlnet.gov/expapi/activities/meeting",
            "moreInfo": "http://virtualmeeting.example.com/345256"
        },
        "objectType": "Activity"
    }
});

// add tests
suite.add('1xParse - 1xStringify - 1xReplace', function () {
    const payloadNoWhitespace = payload.replace(/\s(?=[^"]*"[^"]*")*[^"]*$/g, '');
    const parsedPayload = JSON.parse(payload); // This would be parsed by middleware with every request.
    const deserializedThenReserializedPayload = JSON.stringify(parsedPayload);
}).add('2xParse - 1xStringify - 2xReplace', function () {
    const payloadNoWhitespace = payload.replace(/\s/g, '');
    const parsedPayload = JSON.parse(payload); // This would be parsed by middleware with every request.
    // Since we are removing all whitespace, we have to parse the no whitespace payload, since a key could have a space in it causing the Stringified payloads to be different
    const deserializedThenReserializedPayload = JSON.stringify(JSON.parse(payloadNoWhitespace)).replace(/\s/g, '');
}).add('State Machine', function () {
    const quote = 0x22;
    const slash = 0x2F;
    const space = 0x20;
    const newLine = 0x0A;
    const vertTab = 0x0B;
    const carriageReturn = 0x0D;

    var newPayload = '';
    var currentCharCode;
    var isEscaping = false;
    var inQuotes = false;
    for (var i = 0, il = payload.length; i < il; i++) {
        currentCharCode = payload.charCodeAt(i);
        switch (currentCharCode) {
            case quote:
                if (isEscaping) {
                    // If we saw an escape character previously, then this quote is escaped.
                    isEscaping = !isEscaping;
                    break;
                }
                // Switch the state of whether we are in quotes or not.
                inQuotes = !inQuotes;
                newPayload += payload[i];
                break;
            case slash:
                // Switch the state of whether we are about to escape the next character or not.
                isEscaping = !isEscaping;
                newPayload += payload[i];
                break;
            // Fall through for whitespace
            case space:
            case newLine:
            case vertTab:
            case carriageReturn:
                if (inQuotes) {
                    newPayload += payload[i];
                }
                break;
            default:
                newPayload += payload[i];
                break;
        }
    }
    const parsedPayload = JSON.parse(payload); // This would be parsed by middleware with every request.
    // Since we are removing all whitespace, we have to parse the no whitespace payload, since a key could have a space in it
    const deserializedThenReserializedPayload = JSON.stringify(parsedPayload);
}).on('cycle', function (event) {
    console.log(String(event.target));
}).on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
}).run({ 'async': false });