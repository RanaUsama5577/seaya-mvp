const functions = require("firebase-functions")
const admin = require("firebase-admin")

admin.initializeApp();
const db = admin.firestore()

exports.updateDiverDetails = functions.https.onCall(async (data, context) => {
    var batch = db.batch()
    var batchCount = 0
    var s = false
    var promises = []
    console.log("data",data)
    var leaderID = data.leaderID??""
    var diveID = data.diveID??""
    var groupID = data.groupID??""
    var members = data.members??[]
    var gear = data.gear??""
    const details = data.details??""
    if(members.length == 0 || diveID == "" || leaderID == ""){
        return { "data": "data is not correct format",status:false};
    }
    var obj = Object.keys(members).map(function(key, index) {
        console.log(key)
        var obj = [];
        obj[0] = key;
        obj[1] = members[key]
        return obj
    })
    obj.forEach(function(item){
        if(leaderID == item[0]){
            batch.set(db.collection('dives').doc(diveID).collection('divers_details').doc(),{
                "id": item[0],
                "groupID": groupID,
                "pesonalNote": "",
                "diveNum": null,
                "gear": gear,
                "details": details,
            })
            batchCount = batchCount++;
        }
        else{
            console.log("details",details)
            var details2 = JSON.parse(JSON.stringify(details))
            delete details2['startTank']
            delete details2['endTank']
            delete details2['airMix']
            console.log("logs",details,details2)
            batch.set(db.collection('dives').doc(diveID).collection('divers_details').doc(),{
                "id": item[0],
                "groupID": groupID,
                "pesonalNote": "",
                "diveLeaderNote": item[1],
                "diveNum": null,
                "details": details2,
            })
            batchCount = batchCount++;
        }
        if(batchCount >= 499){
            s = true;
            promises.push(batch.commit());
            batchCount = 0;
            batch = undefined;
            batch = db.batch();
        }
    })
    var timestamp = new Date().getTime().toString()
    batch.set(db.collection('groups').doc(groupID).collection('messages').doc(timestamp),{
        "id": timestamp,
        "groupID": groupID,
        "fromID": "adminID",
        "fromName": "admin",
        "fromPhotoURL": "https://visualpharm.com/assets/451/Admin-595b40b65ba036ed117d286d.svg",
        "content": "we share the dive",
        "createdAt": new Date(),
        "visibleTo": "[]",
        "seenBy": ["adminID"],
        "type": "0"
    })
    if(s == false){
        promises.push(batch.commit());
        batchCount = 0;
        batch = undefined;
    }
    await Promise.all(promises);
    ////Return done
    return { "data": "successfully added documents" ,status:true};
});
