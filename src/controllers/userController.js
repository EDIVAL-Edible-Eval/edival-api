import FirebaseApp from '../configs/firebaseConfig.js'

const signUp = async (req, res) => {
  try{
    const userRecord = await FirebaseApp.auth.createUser({
      email: req.body.email,
      emailVerified: req.body.emailVerified,
      phoneNumber: req.body.phoneNumber,
      password: req.body.password,
      displayName: req.body.displayName
    })
    const newUser = {
      username: userRecord.displayName,
      email: userRecord.email,
      phoneNumber: userRecord.phoneNumber,
      profile_img_path: null,
      theme_preference: null,
      language_preference: null
    }

    const response = FirebaseApp.db.collection("users").doc(userRecord.uid).set(newUser)
    res.send("Successfully created new user");
  } catch (error) {
    res.send(error);
  }
}

const getUserDetails = async (req, res) => {
  // CAUTION : this is not get the id for each reminder. Need fixing
  try {
    const uid = req.get('X-User-Id')
    const usersRef = FirebaseApp.db.collection("users").doc(uid);
    console.log("UID : ", uid)
    const response = await usersRef.get();
    const result = response.data()
    const reminder_snapshot = await usersRef.collection("reminders").get()
    result.reminders = reminder_snapshot.docs.map( (doc) => {
      return {
        id: doc.id,
        detail : doc.data()
      }
    });
    res.send(result);
  } catch (error) {
    res.send(error)
  }
}

const updateUserProfile = async (req, res) => {
  try{
    const uid = req.get('X-User-Id')
    const usersRef = FirebaseApp.db.collection("users").doc(uid);
    let response = await usersRef.get();
    let cp_user = response.data();
    req.body.username && (cp_user.username = req.body.username)
    req.body.theme_preference && (cp_user.theme_preference = req.body.theme_preference)
    req.body.language_preference && (cp_user.language_preference = req.body.language_preference)
    
    if (req.file) {
      // console.log(FirebaseApp.bucket.file(`users/${uid}.txt`).name)
      if (cp_user.profile_img_path) {
        const prevImageProfile = FirebaseApp.bucket.file(cp_user.profile_img_path)
        await prevImageProfile.delete();
      }
      const file = FirebaseApp.bucket.file(`users/${uid}/${req.file.originalname}`, {
        uploadType: {resumable: false},
        contentType: req.file.mimetype,
      });
      await file.save(req.file.buffer);
      cp_user.profile_img_path = `users/${uid}/${req.file.originalname}`
    }
    await usersRef.update(cp_user);
    res.send("OK");
  }catch (error) {
    res.send(error)
  }
}
export default {
  signUp,
  getUserDetails,
  updateUserProfile
}