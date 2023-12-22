import FirebaseApp from '../configs/firebaseConfig.js';
import {Timestamp,FieldValue} from "firebase-admin/firestore";
const notifAllReminders = async(req, res) => {
  try {
    const tommorow = new Date();
    const currentDate = Timestamp.fromDate(tommorow);
    tommorow.setDate(tommorow.getDate()+1);
    const nextDate = Timestamp.fromDate(tommorow);
    const tokenNotif = await FirebaseApp.db.collection("notification_token").get();
    const tokenNotifSnapshot = tokenNotif.docs.map((doc) => {
      return {
        id: doc.id,
        data: doc.data(),
      };
    })

    const listCandidate = []
    for (const objTokenNotif of tokenNotifSnapshot) {
      const nearExpReminder = await FirebaseApp.db.collection(`users/${objTokenNotif.id}/reminders`)
                              .where("exp_date", "<=", nextDate)
                              .where("exp_date", ">=", currentDate)
                              .get()
      const nearExpReminderSnapshot = nearExpReminder.docs.map( (doc) => {
        return {
          reminderId: doc.id,
          reminderData: doc.data(),
        };
      });
      const candidate = {
        id: objTokenNotif.id,
        tokens: objTokenNotif.data.tokens,
        reminder: nearExpReminderSnapshot,
      };
      listCandidate.push(candidate);
    };
    for (const [idx, candidate] of listCandidate.entries()) {
      const message = {
        notification: {
          title: "Edival Reminder",
          body: `There are ${candidate.reminder.length} foods that will expire`,
        },
        tokens: candidate.tokens
      };
      const response = await FirebaseApp.messaging.sendEachForMulticast(message);
      if (response.failureCount > 0) {
        const failedTokens = [];
        for (const [idx, resp] of response.responses.entries()){
            if (!resp.success) {
              failedTokens.push(candidate.tokens[idx]);
              await FirebaseApp.db.doc(`notification_token/${candidate.id}`).update({
                tokens: FieldValue.arrayRemove(candidate.tokens[idx])
              });
            }else{
              console.log(response.successCount + ' messages were sent successfully')
            }
        }       
        console.log('List of tokens that caused failures: ' + failedTokens);
      }
      
      const notif_reminder = await FirebaseApp.db.collection(`users/${candidate.id}/notifications`).add({notifTime : currentDate,...message.notification})
      
      for (const reminder of candidate.reminder){
        await FirebaseApp.db.collection(`users/${candidate.id}/notifications/${notif_reminder.id}/notif_reminder`).doc(`${reminder.reminderId}`).set({...reminder.reminderData});
      } 
    }
    res.send(listCandidate)
  }catch (error) {
    res.status(500).send(error);
  };
}

export default {
  notifAllReminders
}