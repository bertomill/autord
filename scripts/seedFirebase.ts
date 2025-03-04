import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';

// Use your Firebase config from .env.local
const firebaseConfig = {
  apiKey: "AIzaSyA_DskWs2e5eMDWctOIYRItsMjuZMSxI0s",
  authDomain: "stateofinnovation-d344f.firebaseapp.com",
  projectId: "stateofinnovation-d344f",
  storageBucket: "stateofinnovation-d344f.firebasestorage.app",
  messagingSenderId: "314539039954",
  appId: "1:314539039954:web:e34dc540ef746d7b53a10b",
  measurementId: "G-8LM4JQ82F1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedCompanies() {
  const companies = [
    { id: 'aapl', ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { id: 'msft', ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
    { id: 'amzn', ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical' },
    { id: 'googl', ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication Services' },
    { id: 'meta', ticker: 'META', name: 'Meta Platforms Inc.', sector: 'Communication Services' },
    // Add more companies as needed
  ];

  for (const company of companies) {
    await setDoc(doc(db, 'companies', company.id), company);
    console.log(`Added company: ${company.ticker}`);
  }
}

async function seedEarningsCalls() {
  const now = new Date();
  const earningsCalls = [
    {
      id: 'aapl-q2-2023',
      companyId: 'aapl',
      date: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 15)),
      fiscalQuarter: '2',
      fiscalYear: 2023,
      estimatedEPS: 1.43,
    },
    {
      id: 'msft-q2-2023',
      companyId: 'msft',
      date: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 18)),
      fiscalQuarter: '2',
      fiscalYear: 2023,
      estimatedEPS: 2.65,
    },
    {
      id: 'amzn-q2-2023',
      companyId: 'amzn',
      date: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 22)),
      fiscalQuarter: '2',
      fiscalYear: 2023,
      estimatedEPS: 0.58,
    },
    // Add more earnings calls as needed
  ];

  for (const call of earningsCalls) {
    await setDoc(doc(db, 'earningsCalls', call.id), call);
    console.log(`Added earnings call: ${call.id}`);
  }
}

async function main() {
  try {
    await seedCompanies();
    await seedEarningsCalls();
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

main(); 