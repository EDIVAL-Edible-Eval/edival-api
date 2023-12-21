import FirebaseApp from '../configs/firebaseConfig.js';
import {Timestamp} from "firebase-admin/firestore";
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
        tokens: objTokenNotif.data.tokens,
        reminder: nearExpReminderSnapshot,
      };
      listCandidate.push(candidate);
    };
    for (const candidate of listCandidate) {
      const message = {
        data: {
          title: "Edival Reminder",
          body: `There are ${candidate.reminder.length} foods that will expire`
        },
        tokens: candidate.tokens
      };
      const response = await FirebaseApp.messaging.sendEachForMulticast(message);
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(candidate.tokens[idx]);
          }
        });
        console.log('List of tokens that caused failures: ' + failedTokens);
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