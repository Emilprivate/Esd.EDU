/*
Declare an object "msgBoard" that represents a message board that a set of clients can use to exchange messages.
It should have a property for the  name of the message board, initialized to "IWP Chat", and another property (array) for storing the history of messages. 
Add a function (method) to the object called "putMessage" that takes a string message as argument at stores it in the message array.
Add a function (method) that prints the received messages to the console. I.e, the messageBoard could be used like:

    msgBoard.putMessage("Hej, dette er en test");
    msgBoard.putMessage("Hej IWP");
    msgBoard.printMessages();

    It should result in the following output
    Messages History in board IWP Chat:
    Hej, dette er en test
    Hej IWP
*/

var msgBoard = {
    name:"IWP Chat",
    msgArr: [],
    putMessage: function(msgString){
        this.msgArr.push(msgString);
    },
    printMessages: function(){
        for (i in this.msgArr)
            console.log(this.msgArr[i]);
    }
}

/*msgBoard.putMessage("Test!");
msgBoard.putMessage("Test2!");
msgBoard.printMessages();*/

/*
Add a function "register(f)" to the object that clients use to be notified when new messages arrives (a so-called call-back function): 
The register function takes a function f as argument, and stores the passed function in a different array "callBacks". f itself takes two parameters: 
the name of the message board, and the message. Then prints them to the console, possibly in an client specific manner (eg language).   
Based on the putMessage method, add a similar one "sendAndNotify" that in addition to storing the message (eg using putMessage) also calls all 
registered call-back functions whenever a message arrives (supplying the registered function with the new message, and boardname.

Make a constructor function  MessageBoard(name) that makes message boards.
Create a few message boards.
*/

var msgBoard = {
    name:"IWP Chat",
    msgArr: [],
    callBacks: [],
    putMessage: function(msgString){
        this.msgArr.push(msgString);
    },
    printMessages: function(){
        for (i of this.msgArr)
            console.log(this.msgArr[i]);
    },
    register: function(f){
        if (f.length === 2)
            this.callBacks.push(f);
    },
    sendAndNotifyMessage: function(msgString){
        this.putMessage(msgString);

        for (i of this.callBacks)
            i(this.name, msgString);
    },
    create: function(name){
        var obj = Object.create(this);
        obj.name = name;
        return obj;
    }
}

function briansHandler(boardName,message){
    console.log(`Brian! A message from ${boardName}: ${message}`);
}

var msgBoard2 = msgBoard.create("IWP Chat");

msgBoard2.register(briansHandler);
msgBoard2.register((board,message)=>console.log(`Board ${board} says to Michele: ${message}`));
msgBoard2.sendAndNotifyMessage("URGENT: Opgaveregning nu!")