import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  query, where, arrayUnion, arrayRemove, Timestamp 
} from 'firebase/firestore';

// User functions
export async function getUser(userId: string) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
}

export async function createUser(userId: string, userData: Record<string, unknown>) {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...userData,
    createdAt: Timestamp.now(),
  });
}

// Company functions
export async function getCompanies() {
  const companiesRef = collection(db, 'companies');
  const snapshot = await getDocs(companiesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getCompany(companyId: string) {
  const companyRef = doc(db, 'companies', companyId);
  const companySnap = await getDoc(companyRef);
  return companySnap.exists() ? { id: companySnap.id, ...companySnap.data() } : null;
}

// Follow/unfollow functions
export async function followCompany(userId: string, companyId: string) {
  const userFollowsRef = doc(db, 'userFollows', userId);
  const userFollowsSnap = await getDoc(userFollowsRef);
  
  if (userFollowsSnap.exists()) {
    await updateDoc(userFollowsRef, {
      companies: arrayUnion(companyId)
    });
  } else {
    await setDoc(userFollowsRef, {
      companies: [companyId]
    });
  }
}

export async function unfollowCompany(userId: string, companyId: string) {
  const userFollowsRef = doc(db, 'userFollows', userId);
  await updateDoc(userFollowsRef, {
    companies: arrayRemove(companyId)
  });
}

export async function getFollowedCompanies(userId: string) {
  const userFollowsRef = doc(db, 'userFollows', userId);
  const userFollowsSnap = await getDoc(userFollowsRef);
  
  if (!userFollowsSnap.exists()) {
    return [];
  }
  
  const followedCompanyIds = userFollowsSnap.data().companies || [];
  const companies = [];
  
  for (const companyId of followedCompanyIds) {
    const company = await getCompany(companyId);
    if (company) {
      companies.push(company);
    }
  }
  
  return companies;
}

// Earnings calls functions
export async function getEarningsCallsForUser(userId: string) {
  const userFollowsRef = doc(db, 'userFollows', userId);
  const userFollowsSnap = await getDoc(userFollowsRef);
  
  if (!userFollowsSnap.exists()) {
    return [];
  }
  
  const followedCompanyIds = userFollowsSnap.data().companies || [];
  
  if (followedCompanyIds.length === 0) {
    return [];
  }
  
  const earningsCallsRef = collection(db, 'earningsCalls');
  const q = query(earningsCallsRef, where('companyId', 'in', followedCompanyIds));
  const snapshot = await getDocs(q);
  
  interface EarningsCall {
    id: string;
    companyId: string;
    company?: Record<string, unknown>;
    [key: string]: unknown;
  }
  
  const earningsCalls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EarningsCall[];
  
  // Get company details for each earnings call
  for (const call of earningsCalls) {
    const company = await getCompany(call.companyId);
    if (company) {
      call.company = company;
    }
  }
  
  return earningsCalls;
} 