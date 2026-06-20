import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp, getDoc, getDocs, limit,
} from 'firebase/firestore';
import { db } from '../firebase';

export function useCollection(path, constraints = []) {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!path) return;
    const ref = query(collection(db, path), ...constraints);
    const unsub = onSnapshot(ref,
      snap => { setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      err  => { setError(err); setLoading(false); }
    );
    return unsub;
  }, [path]);

  return { docs, loading, error };
}

export async function addDocument(path, data) {
  return addDoc(collection(db, path), { ...data, createdAt: serverTimestamp() });
}

export async function updateDocument(path, id, data) {
  return updateDoc(doc(db, path, id), { ...data, updatedAt: serverTimestamp() });
}

export async function getDocument(path, id) {
  const snap = await getDoc(doc(db, path, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export { where, orderBy, limit };
