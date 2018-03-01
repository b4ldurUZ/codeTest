var messageSchedule = {};
var messageList = [];
var Client = require('node-rest-client').Client;
var client = new Client();

function addMessageToSchedule(time, messageKey) {
    messageSchedule[time] = messageSchedule[time] || [];
    messageSchedule[time].push(messageKey);
}

function addMessageToList(message) {
    messageList.push(message);
    return messageList.indexOf(message);
}

function readMessageInformation() {
    var fs = require('fs');
    //Read file with sync read, because we actually want to build the schedule on startup
    var input = new fs.readFileSync('customers.csv');
    var csv = require('csv-parse/lib/sync');
    var buffer = csv(input, {columns: true});
    for( var j = 0, size = buffer.length; j < size; j++) {
        var messageIndex = addMessageToList(buffer[j].email+";"+buffer[j].text+";false");
        var schedule = buffer[j].schedule;
        var times = schedule.split("-");
        for (var i = 0, len = times.length; i < len; i++ ) {
            var regex = /\d*/;
            var time = times[i].match(regex);
            addMessageToSchedule(time, messageIndex);
        }
    }
}

function retrieveMessageList(indices) {
    var messages = [];
    for(index in indices) {
        if(indices.hasOwnProperty(index)) {
            messages.push(messageList[indices[index]]);
        }
    }
    return messages;
}

function billPaid(message) {
    var index = messageList.indexOf(message+";false");
    messageList[index] = message+";true";
}

function sendMessage(args,time) {
    setTimeout(function () {
        var checkMessage = args.data.email+";"+args.data.text+";false";
        if(messageList.indexOf(checkMessage) !== -1) {
            client.post("http://localhost:9090/messages",
                args,
                function (data, response) {
                    if(response.statusCode === 201) {
                        console.log("Message sent successfully to "+data.email);
                        if(data.paid === true) {
                            billPaid(data.email+";"+data.text);
                        }
                    }
                    else {
                        console.log("Something somewhere went terribly wrong");
                        console.log(data);
                        console.log("Status-Code: "+response.statusCode);
                    }
                })}
            },
            (time*1000));

}

function scheduleMessages() {
    for(var time in messageSchedule) {
        if(messageSchedule.hasOwnProperty(time)) {
            var messageIndices = messageSchedule[time];
            var messages = retrieveMessageList(messageIndices);
            for (var key in messages) {
                if (messages.hasOwnProperty(key)) {
                    var message = messages[key];
                    var items = message.split(";");
                    var args = {
                        data: {"email": items[0], "text": items[1]},
                        headers: {"Content-Type": "application/json"}
                    };
                    sendMessage(args, time);
                }
            }
        }
    }
}

/*
Let's start by reading the file and building an ordered schedule-map
 */
readMessageInformation();
scheduleMessages();

/*
Next, we iterate over the schedule and kick off all the messages
 */