import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';
import { auth } from '../firebase';

export function useAuth() {
  const [user,    setUser]    = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signOut = () => fbSignOut(auth);

  return { user, loading, signIn, signOut };
}
