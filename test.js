let RhymeSyncClient = require("./rhymeSync-client");


let rhymeSync = new RhymeSyncClient("localhost", 80, {
    group: "rhymeSyncTest",
    serverAccessPassword: "SIMPLE_NONHASHED_PASSWORD_HERE",
    receiverCallback: receiver
});

function receiver(arg){
    console.log(arg);
    
    if (IDTrickNotUsed){
        IDTrickNotUsed=false;

        setTimeout(()=>{
            console.log("\ngetGroupOfClient");
            rhymeSync.getGroupOfClient(arg.toID);
        }, 5000);
        
        setTimeout(()=>{
            console.log("\nsendDataToSpecificClient");
            rhymeSync.sendDataToSpecificClient(arg.toID, "toSpecificClientTest", "SUCCESS!! 1");
        }, 6000);

    }
}

setTimeout(()=>{
    console.log("\ngetServerStatus");
    rhymeSync.getServerStatus();
}, 500);

setTimeout(()=>{
    console.log("\ngetAllActiveSockets");
    rhymeSync.getAllActiveSockets();
}, 1500);

setTimeout(()=>{
    console.log("\ngetAllLowMemoryAidSockets");
    rhymeSync.getAllLowMemoryAidSockets();
}, 2500);

setTimeout(()=>{
    console.log("\ngetAllGroups");
    rhymeSync.getAllGroups();
}, 3500);

setTimeout(()=>{
    console.log("\ngetAllClientsInGroup");
    rhymeSync.getAllClientsInGroup(rhymeSync.group);
}, 4500);

IDTrickNotUsed = true;

setTimeout(()=>{
    console.log("\nsendDataToAllInGroup");
    rhymeSync.sendDataToAllInGroup(rhymeSync.group, "toAllInGroupTest", "SUCCESS!! 2");
}, 7500);

setTimeout(()=>{
    console.log("\nsendDataToAllLowMemoryAidSockets");
    rhymeSync.sendDataToAllLowMemoryAidSockets("toAllLowMemoryAidSocketsTest", "SUCCESS!! 3");
}, 8500);

setTimeout(()=>{
    console.log("\nsendDataToAll");
    rhymeSync.sendDataToAll("toAllTest", "SUCCESS!! 4");
}, 9500);