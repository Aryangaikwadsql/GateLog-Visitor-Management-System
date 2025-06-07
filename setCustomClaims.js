const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json'); // Replace with your service account key file path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'USER_UID_HERE'; // Replace with the UID of the user to set the watchman role

admin.auth().setCustomUserClaims(uid, { role: 'watchman' })
  .then(() => {
    console.log('Custom claim "watchman" set for user:', uid);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting custom claim:', error);
    process.exit(1);
  });
