let messageSchedule = {};
let messageList = [];
let Client = require('node-rest-client').Client;
let client = new Client();

function addMessageToSchedule(time, messageKey) {
    messageSchedule[time] = messageSchedule[time] || [];
    messageSchedule[time].push(messageKey);
}

function addMessageToList(message) {
    messageList.push(message);
    return messageList.indexOf(message);
}

function readMessageInformation() {
    let fs = require('fs');
    //Read file with sync read, because we actually want to build the schedule on startup
    let input = new fs.readFileSync('customers.csv');
    let csv = require('csv-parse/lib/sync');
    let buffer = csv(input, {columns: true});
    for( let j = 0, size = buffer.length; j < size; j++) {
        let messageIndex = addMessageToList(buffer[j].email+";"+buffer[j].text+";false");
        let schedule = buffer[j].schedule;
        let times = schedule.split("-");
        for (let i = 0, len = times.length; i < len; i++ ) {
            let regex = /\d*/;
            let time = times[i].match(regex);
            addMessageToSchedule(time, messageIndex);
        }
    }
}

function retrieveMessageList(indices) {
    let messages = [];
    for(index in indices) {
        if(indices.hasOwnProperty(index)) {
            messages.push(messageList[indices[index]]);
        }
    }
    return messages;
}

function billPaid(message) {
    let index = messageList.indexOf(message+";false");
    messageList[index] = message+";true";
}

function sendMessage(args,time) {
    setTimeout(function () {
        let checkMessage = args.data.email+";"+args.data.text+";false";
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
    for(let time in messageSchedule) {
        if(messageSchedule.hasOwnProperty(time)) {
            let messageIndices = messageSchedule[time];
            let messages = retrieveMessageList(messageIndices);
            for (let key in messages) {
                if (messages.hasOwnProperty(key)) {
                    let message = messages[key];
                    let items = message.split(";");
                    let args = {
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