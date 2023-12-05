import FirebaseApp from '../configs/firebaseConfig.js'

const addReminder = async(req, res) => {
  // POST: Add reminder <- Parse nilai date ke nanosecond
  try{
    const newReminder = {
      name : req.body.name,
      type : req.body.type,
      storage_type : req.body.storage_type,
      store_date : req.body.store_date,
      exp_date : req.body.exp_date,
      status : req.body.status
    }
    const uid = req.get('X-User-Id')
    if(req.file) {
      const file = FirebaseApp.bucket.file(`users/${uid}/reminders/${req.file.originalname}`, {
        uploadType: {resumable: false},
        contentType: req.file.mimetype,
      });
      await file.save(req.file.buffer)
      newReminder.img_path = `users/${uid}/reminders/${req.file.originalname}` 
    }
    console.log(newReminder)


    const response = await FirebaseApp.db.collection(`users/${uid}/reminders`).add(newReminder);
    res.send("OK")
  }catch (error) {
    res.send(error)
  }
}

const deleteReminder = async(req, res) => {
  try {
    const uid = req.get('X-User-Id')
    const requestBody = req.body;
    const response = await FirebaseApp.db.collection(`users/${uid}/reminders`).doc(`${requestBody.id}`).delete();
    res.send(response)
  }catch (error) {
    res.send(error)
  }
}

const updateReminder = async(req, res) => {
  try {
    const uid = req.get('X-User-Id')
    const requestBody = req.body;
    const reminderRef = FirebaseApp.db.collection(`users/${uid}/reminders`).doc(requestBody.id);
    let response = await reminderRef.get();
    let cpReminder = response.data()
    console.log(requestBody)
    requestBody.name && (cpReminder.name = requestBody.name);
    requestBody.type && (cpReminder.type = requestBody.type);
    requestBody.storage_type && (cpReminder.storage_type = requestBody.storage);
    requestBody.store_date && (cpReminder.store_date = requestBody.store_date);
    requestBody.exp_date && (cpReminder.exp_date = requestBody.exp_date);
    requestBody.status && (cpReminder.status = requestBody.status);
    if (req.file){
      if (cpReminder.img_path){
        const prevFile = FirebaseApp.bucket.file(cpReminder.img_path);
        await prevFile.delete();
      }
      
      const file = FirebaseApp.bucket.file(`users/${uid}/reminders/${req.file.originalname}`, {
        uploadType: {resumable: false},
        contefntType: req.file.mimetype,
      });
      await file.save(req.file.buffer)
      cpReminder.img_path = `users/${uid}/reminders/${req.file.originalname}`
    }
    await reminderRef.update(cpReminder)
    res.send("OK")
  }catch (error) {
    res.send(error)
  }
}

export default {
  addReminder,
  deleteReminder,
  updateReminder
}