import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

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

async function findMayank() {
  console.log('--- Fetching users ---');
  const usersSnap = await getDocs(collection(db, 'users'));
  const users = [];
  usersSnap.forEach((d) => {
    const data = d.data();
    users.push({ id: d.id, ...data });
  });

  const mayankUsers = users.filter((u) => {
    const str = JSON.stringify(u).toLowerCase();
    return str.includes('mayank');
  });

  console.log('Found Mayank users:', JSON.stringify(mayankUsers, null, 2));

  for (const u of (mayankUsers.length ? mayankUsers : users)) {
    console.log(`\n--- Transactions for user: ${u.name || u.email || u.id} (${u.id}) ---`);
    const txSnap = await getDocs(query(collection(db, 'wallet_transactions'), where('userId', '==', u.id)));
    const txs = txSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    txs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    console.log(`Found ${txs.length} transactions:`, JSON.stringify(txs, null, 2));
  }

  // Also check all wallet_transactions
  console.log('\n--- All wallet_transactions ---');
  const allTxSnap = await getDocs(collection(db, 'wallet_transactions'));
  const allTxs = allTxSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  allTxs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  console.log('Total wallet_transactions:', allTxs.length);
  console.log(JSON.stringify(allTxs, null, 2));
}

findMayank().catch(console.error);
