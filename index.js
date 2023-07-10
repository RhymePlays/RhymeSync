let { Server } = require("socket.io")


/*---------*\
| Variables |
\*---------*/
var activeSockets = []
var sockets2Groups = {}
var groups2Sockets = {}
var debuggerSockets = []
var debuggerAccessPassword = "SIMPLE_NONHASHED_PASSWORD_HERE"
const LOW_MEMORY = false


/*-----------*\
| Init Socket |
\*-----------*/
const io = new Server(80, {
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

function sendToAllDebuggers(fromID, subject, data){
    for (index in debuggerSockets){
        if (debuggerSockets[index] != fromID){
            send(fromID, debuggerSockets[index], subject, data);
        }
    }
}

function sendToAllInGroup(fromID, group, subject, data){
    if (group != undefined){
        if (groups2Sockets.includes(group)){
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
| 'debuggerReciever' channel is to be used for Debugging and   |
| monitoring related cases. Debuggers will have access to BOTH |
| the 'debuggerReciever' AND the "clientReceiver"              |
|                                                              |
| Actual programs, however, should only use the                |
| "clientReceiver"                                             |
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
        
        // Remove from debuggerSockets ---
        if (debuggerSockets.includes(socketObj.id)){debuggerSockets.splice(debuggerSockets.indexOf(socketObj.id), 1);}
        
        // Remove from Groups ---
        else{
            if (LOW_MEMORY){
                sendToAllDebuggers(socketObj.id, "clientDisconnected", {})
            }else{
                if (sockets2Groups.includes(socketObj.id)){
                    groups2Sockets[sockets2Groups[socketObj.id]].splice(groups2Sockets[sockets2Groups[socketObj.id]].indexOf(socketObj.id), 1);
                    delete sockets2Groups[socketObj.id];
                }
            }
        }
    });
    
    // Registering to the Network.
    socketObj.emit("readyToIdentify", true);
    socketObj.on("identification", (arg)=>{

        // Add to debuggerSockets ---
        if (arg.subject = "identifyDebugger"){
            if (arg.data == debuggerAccessPassword){debuggerSockets.push(socketObj.id);}
        
        // Add to Groups ---
        } else if (typeof(arg.data)=='string' && arg.data.length < 32) {
            if (LOW_MEMORY){
                sendToAllDebuggers(socketObj.id, "clientIdentified", arg.data)
            }else{
                if (groups2Sockets.includes(arg.data)){groups2Sockets[arg.data].push(socketObj.id)}
                else {groups2Sockets[arg.data]=[socketObj.id]}
                sockets2Groups[socketObj.id] = arg.data

                sendToAllDebuggers(socketObj.id, "clientIdentified", arg.data)
            }
        }
    })

    /*---------    ---------*\
    | Server Status Commands |
    \*---------    ---------*/

    socketObj.on("getServerStatus", ()=>{
        if ( debuggerSockets.includes(socketObj.id) || arg.debuggerAccessPassword==debuggerAccessPassword ){
            send("SERVER", socketObj.id, "serverStatus", {totalUsers: activeSockets.length, totalGroups: groups2Sockets.length, totalDebuggers: debuggerSockets.length})
        }
    });
    socketObj.on("getAllActiveSockets", ()=>{
        if ( debuggerSockets.includes(socketObj.id) || arg.debuggerAccessPassword==debuggerAccessPassword ){
            send("SERVER", socketObj.id, "allActiveSockets", activeSockets)
        }
    });
    socketObj.on("getAllDebuggers", ()=>{
        send("SERVER", socketObj.id, "allDebuggers", debuggerSockets)
    });
    socketObj.on("getAllGroups", ()=>{
        if ( debuggerSockets.includes(socketObj.id) || arg.debuggerAccessPassword==debuggerAccessPassword ){
            let returnValue = []
            for (index in groups2Sockets){returnValue.push(index)}
            send("SERVER", socketObj.id, "allGroups", returnValue)
        }
    });
    socketObj.on("getAllUsersInGroup", (arg)=>{ // --- REQ {group: X}
        if ( debuggerSockets.includes(socketObj.id) || arg.debuggerAccessPassword==debuggerAccessPassword ){
            if (arg.group =! undefined){send("SERVER", socketObj.id, "allUsersInGroup", groups2Sockets[arg.group])}
        }
    });
    socketObj.on("getGroupOfClient", (arg)=>{ // --- REQ {clientID: X} 
        if ( debuggerSockets.includes(socketObj.id) || arg.debuggerAccessPassword==debuggerAccessPassword ){
            if (arg.clientID =! undefined){send("SERVER", socketObj.id, "groupOfUser", sockets2Groups[arg.clientID])}
        }
    })
    

    /*---------    ---------*\
    | Communication Commands |
    \*---------    ---------*/

    socketObj.on("sendDataToSpecificClient", (arg)=>{send(socketObj.id, arg.toID, arg.subject, arg.data)}); // --- REQ {toID: X, subject: Y, data: Z}
    socketObj.on("sendDataToAllInGroup", (arg)=>{sendToAllInGroup(socketObj.id, arg.toGroup, arg.subject, arg.data)}); // --- REQ {toGroup: X, subject: Y, data: Z}
    socketObj.on("sendDataToAllDebuggers", (arg)=>{sendToAllDebuggers(socketObj.id, arg.subject, arg.data)}); // --- REQ {subject: X, data: Y}
    socketObj.on("sendDataToAll", (arg)=>{sendToAll(socketObj.id, arg.subject, arg.data)}); // --- REQ {subject: X, data: Y}
})
