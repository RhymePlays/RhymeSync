let { Server } = require("socket.io");


/*---------*\
| Variables |
\*---------*/
const serverPort = 80;
const serverAccessPassword = "SIMPLE_NONHASHED_PASSWORD_HERE";

var activeSockets = [];
var sockets2Groups = {};
var groups2Sockets = {};


/*-----------*\
| Init Socket |
\*-----------*/
const io = new Server(serverPort, {
    cors: {origin: "*", methods: ["GET", "POST"]}
});


/*---------*\
| Functions |
\*---------*/
function send(fromID, toID, subject, data){
    try{io.to(toID).emit("clientReceiver", {fromID: fromID, toID: toID, subject: subject, data: data});}catch(e){}
}

function sendToAll(fromID, subject, data){
    for (index in activeSockets){
        if (activeSockets[index] != fromID){ // Won't send the data back to the client it got it from to avoid looping
            send(fromID, activeSockets[index], subject, data);
        }
    }
}

function sendToAllInGroup(fromID, group, subject, data){ // (TODO: Low Memory Fix)
    if (group != undefined){
        if (group in groups2Sockets){
            for (index in groups2Sockets[group]){
                if (groups2Sockets[group][index] != fromID){
                    send(fromID, groups2Sockets[group][index], subject, data);
                }
            }
        }
    }
}



// ------ Comments ------ \\ 

/*------------------------------------------------------------*\
| Request Structure: (*toID), subject, data                    | 
\*------------------------------------------------------------*/

/*------------------------------------------------------------*\
| Response Structure: fromID, toID, subject, data              | 
\*------------------------------------------------------------*/

/*------------------------------------------------------------*\
| groups2Sockets Structure:                                    |
| {                                                            |
|    GroupID_ProtocolV1: [socketID1, socketID2],               |
|    GroupID_ProtocolV2: [socketID1, socketID2]                |
| }                                                            |
|                                                              |
| Delete Metadata once the socket disconnects.                 |
\*------------------------------------------------------------*/

/*------------------------------------------------------------*\
| TODO: Low Memory Group Management (Fix)                      |
|                                                              |
| Request Group-Data from any debuggers that maybe keeping     |
| tabs of the clients using 'clientIdentified'. Provide all    |
| debuggers with the clientID of the client requesting said    |
| data, and ask the debugger to send the data to the client    |
| using sendDataToSpecificClient.                              |
| If the client doesn't receive said data, that could either   |
| mean that the client doesn't have permission to request the  |
| data, or that there simply was no debugger keeping tabs on   |
| 'clientIdentified'.                                          |
\*------------------------------------------------------------*/



io.on("connection", (socketObj)=>{

    /*-------    -------*\
    | Client Management  |
    \*-------    -------*/

    // Add to activeSockets ---
    activeSockets.push(socketObj.id);

    socketObj.on("disconnect", ()=>{
        // Remove from activeSockets ---
        activeSockets.splice(activeSockets.indexOf(socketObj.id), 1);
        
        // Remove from Groups ---
        if (socketObj.id in sockets2Groups){
            groups2Sockets[sockets2Groups[socketObj.id]].splice(groups2Sockets[sockets2Groups[socketObj.id]].indexOf(socketObj.id), 1);
            delete sockets2Groups[socketObj.id];
        }
    });
    
    // Registering to the Network.
    socketObj.emit("readyToIdentify", true);
    socketObj.on("identification", (arg)=>{ // --- REQ {subject: X, data: Y}}
        
        // Add to Groups ---
        if (typeof(arg.data) == 'string') {
            if (arg.data.length < 33 && arg.data.length > 0){
                if (arg.data in groups2Sockets){groups2Sockets[arg.data].push(socketObj.id);}
                else {groups2Sockets[arg.data]=[socketObj.id];}
                sockets2Groups[socketObj.id] = arg.data;
            }
        }
        
    });


    /*---------    ---------*\
    | Server Status Commands |
    \*---------    ---------*/
    socketObj.on("getServerStatus", ()=>{
        send("server", socketObj.id, "serverStatus", {totalClients: activeSockets.length});
    });
    socketObj.on("getAllActiveSockets", (arg)=>{ // --- REQ {serverAccessPassword: X}
        if ( arg.serverAccessPassword==serverAccessPassword ){
            send("server", socketObj.id, "allActiveSockets", activeSockets);
        }
    });
    socketObj.on("getAllGroups", (arg)=>{ // --- REQ {serverAccessPassword: X} (TODO)
        if ( arg.serverAccessPassword==serverAccessPassword ){
            let returnValue = [];
            for (index in groups2Sockets){returnValue.push(index);}
            send("server", socketObj.id, "allGroups", returnValue);
        }
    });
    socketObj.on("getAllClientsInGroup", (arg)=>{ // --- REQ {group: X} (TODO)
        if (arg.group != undefined){send("server", socketObj.id, "allClientsInGroup", {group: arg.group, clients: groups2Sockets[arg.group]});}
    });
    socketObj.on("getGroupOfClient", (arg)=>{ // --- REQ {clientID: X} (TODO)
        if ( arg.serverAccessPassword==serverAccessPassword ){
            if (arg.clientID != undefined){send("server", socketObj.id, "groupOfClient", {client: arg.clientID, group: sockets2Groups[arg.clientID]});}
        }
    })
    socketObj.on("clearGroup2Socket", ()=>{
        if ( arg.serverAccessPassword==serverAccessPassword ){
            groups2Sockets = [];
        }
    });


    /*---------    ---------*\
    | Communication Commands |
    \*---------    ---------*/
    socketObj.on("sendDataToSpecificClient", (arg)=>{send(socketObj.id, arg.toID, arg.subject, arg.data)}); // --- REQ {toID: X, subject: Y, data: Z}
    socketObj.on("sendDataToAllInGroup", (arg)=>{sendToAllInGroup(socketObj.id, arg.group, arg.subject, arg.data)}); // --- REQ {group: X, subject: Y, data: Z} (TODO)
    socketObj.on("sendDataToAll", (arg)=>{sendToAll(socketObj.id, arg.subject, arg.data)}); // --- REQ {subject: X, data: Y}
})