import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA4GGmEvT2yApRrXdpj3Os8zpRDFoW7JTE',
  authDomain: 'lastmiledelivery-b0bdd.firebaseapp.com',
  projectId: 'lastmiledelivery-b0bdd',
  storageBucket: 'lastmiledelivery-b0bdd.firebasestorage.app',
  messagingSenderId: '596146850741',
  appId: '1:596146850741:web:2bb089d745f8059698a7fc',
  measurementId: 'G-KZG76GYD6J',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteMayankLastTopup() {
  console.log('--- Finding Mayank User ---');
  const usersSnap = await getDocs(collection(db, 'users'));
  let mayankUser = null;

  usersSnap.forEach((d) => {
    const data = d.data();
    if (
      (data.name && data.name.toLowerCase().includes('mayank')) ||
      (data.email && data.email.toLowerCase().includes('mayank')) ||
      d.id === 'NK1N0J6Iw3Zzoxg5LszTk2bFuvI2'
    ) {
      mayankUser = { id: d.id, ...data };
    }
  });

  if (!mayankUser) {
    console.error('Mayank user not found!');
    return;
  }

  console.log(`Found Mayank user: ${mayankUser.name} (${mayankUser.id})`);

  // Fetch transactions
  const txSnap = await getDocs(
    query(collection(db, 'wallet_transactions'), where('userId', '==', mayankUser.id))
  );
  const txs = txSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  console.log(`Current transactions count: ${txs.length}`);

  // Find the last CREDIT top-up transaction
  const creditTxs = txs.filter((t) => t.type === 'CREDIT');
  creditTxs.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  if (creditTxs.length === 0) {
    console.log('No CREDIT top-up transaction found for Mayank.');
    return;
  }

  const lastTopup = creditTxs[0];
  console.log('Deleting last top-up transaction:', lastTopup);

  // Delete the transaction doc
  await deleteDoc(doc(db, 'wallet_transactions', lastTopup.id));
  console.log(`Successfully deleted transaction ID: ${lastTopup.id}`);

  // Recalculate remaining ledger balance
  const remainingTxSnap = await getDocs(
    query(collection(db, 'wallet_transactions'), where('userId', '==', mayankUser.id))
  );
  const remainingTxs = remainingTxSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const baseBalance = typeof mayankUser.initialCredit === 'number' ? mayankUser.initialCredit : 5000;
  const totalCredits = remainingTxs
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalDebits = remainingTxs
    .filter((t) => t.type === 'DEBIT')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const newBalance = Math.max(0, Math.round((baseBalance + totalCredits - totalDebits) * 100) / 100);

  console.log(`Recalculated Balance: ${baseBalance} (base) + ${totalCredits} (credits) - ${totalDebits} (debits) = ₹${newBalance}`);

  // Update user document
  await updateDoc(doc(db, 'users', mayankUser.id), {
    walletBalance: newBalance,
    updatedAt: new Date().toISOString(),
  });

  console.log(`Updated user ${mayankUser.id} walletBalance to ₹${newBalance}`);
}

deleteMayankLastTopup()
  .then(() => {
    console.log('--- Done! ---');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
