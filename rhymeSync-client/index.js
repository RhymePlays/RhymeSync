let { io } = require("socket.io-client");


/**
 * Client to interface with the rhymeSync server.
 * 
 * @example
 * let rhymeSync = new RhymeSyncClient("localhost", 80, {
 *     group: "",
 *     receiverCallback: function(){},
 *     onConnectCallback: function(){},
 *     onIdentifyCallback: function(){},
 *     serverAccessPassword: ""
 * })
 */
class RhymeSyncClient {
    constructor(serverIP="localhost", serverPort=80, opts={}){
        this.serverIP = serverIP || "localhost";
        this.serverPort = serverPort || 80;

        this.group = opts.group || "";
        this.receiverCallback = opts.receiverCallback
        this.onConnectCallback = opts.onConnectCallback
        this.onIdentifyCallback = opts.onIdentifyCallback
        this.serverAccessPassword = opts.serverAccessPassword || "";

        this.connectToServer();
    }

    connectToServer(){
        this.socketObj = io(`ws://${this.serverIP}:${this.serverPort}`);

        // On Connect
        this.socketObj.on("connect", ()=>{
            if (typeof(this.onConnectCallback)=="function"){this.onConnectCallback();}
        });

        // Identification
        this.socketObj.on("readyToIdentify", ()=>{
            if (typeof(this.group)=='string'){
                if (this.group.length < 33 && this.group.length > 0){
                    this.send("identification", {subject: "identifyClient", data: this.group});
                    if (typeof(this.onIdentifyCallback)=="function"){this.onIdentifyCallback();}
                }
            }
        });

        // Receiver
        this.socketObj.on("clientReceiver", (arg)=>{
            if (typeof(this.receiverCallback) == "function"){this.receiverCallback(arg);}
        });
    }

    
    /*------   ------*\
    |   Transceiver   |
    \*------   ------*/
    send(channel, payload){
        if (typeof(channel) == 'string'){
            this.socketObj.emit(channel, payload);
        }
    }


    /*---------    ---------*\
    | Server Status Commands |
    \*---------    ---------*/
    getServerStatus(){this.send("getServerStatus", {});}
    getAllActiveSockets(){this.send("getAllActiveSockets", {serverAccessPassword: this.serverAccessPassword});}
    getAllLowMemoryAidSockets(){this.send("getAllLowMemoryAidSockets", {})}
    getAllGroups(){this.send("getAllGroups", {serverAccessPassword: this.serverAccessPassword});}
    getAllClientsInGroup(group){this.send("getAllClientsInGroup", {group: group});}
    getGroupOfClient(clientID){this.send("getGroupOfClient", {clientID: clientID, serverAccessPassword: this.serverAccessPassword});}


    /*---------    ---------*\
    | Communication Commands |
    \*---------    ---------*/
    sendDataToSpecificClient(toID, subject, data){this.send("sendDataToSpecificClient", {toID: toID, subject: subject, data: data});}
    sendDataToAllInGroup(group, subject, data){this.send("sendDataToAllInGroup", {group: group, subject: subject, data: data});}
    sendDataToAllLowMemoryAidSockets(subject, data){this.send("sendDataToAllLowMemoryAidSockets", {subject: subject, data: data});}
    sendDataToAll(subject, data){this.send("sendDataToAll", {subject: subject, data: data});}
}

// class LowMemoryAid extends rhymeSyncClient{

// }

module.exports = RhymeSyncClient