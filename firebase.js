const firebaseConfig = {
  apiKey: "AIzaSyAGFnP6wNzzy3jgvkjXxwpTmRFOpP3HvgU",
  authDomain: "blackjack-torneo.firebaseapp.com",
  databaseURL: "https://blackjack-torneo-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "blackjack-torneo",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

auth.signInAnonymously();
