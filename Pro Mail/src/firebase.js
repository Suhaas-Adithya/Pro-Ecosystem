// Pro Mail Firebase Polyfill -> Local OS Backend (Offline)

export const isMocked = true;

// --- AUTH POLYFILL ---
let _currentUser = null;
let _authListeners = [];

export const firebaseAuth = {
  get currentUser() { return _currentUser; },
  onAuthStateChanged: (cb) => {
    _authListeners.push(cb);
    fetch('http://localhost:3001/api/profile?uid=global_device')
      .then(r => r.json())
      .then(d => {
         if(d.profile && d.profile.email) {
           _currentUser = { uid: 'global_device', email: d.profile.email, displayName: d.profile.username || d.profile.email.split('@')[0] };
         } else {
           _currentUser = { uid: 'global_device', email: 'admin@pro.com', displayName: 'Admin' };
         }
         cb(_currentUser);
      })
      .catch(() => {
         _currentUser = { uid: 'global_device', email: 'admin@pro.com', displayName: 'Admin' };
         cb(_currentUser);
      });
    return () => { _authListeners = _authListeners.filter(l => l !== cb); };
  }
};

export const signInEmail = async (email, password) => { 
    _currentUser = { uid: 'global_device', email, displayName: email.split('@')[0] }; 
    _authListeners.forEach(cb => cb(_currentUser)); 
};
export const signUpEmail = async (email, password) => { 
    _currentUser = { uid: 'global_device', email, displayName: email.split('@')[0] }; 
    _authListeners.forEach(cb => cb(_currentUser)); 
};
export const logOut = async () => { 
    _currentUser = null; 
    _authListeners.forEach(cb => cb(null)); 
};
export const signInWithGoogle = async () => { return { user: _currentUser }; };
export const reauthenticateUser = async () => {};
export const updateUserPassword = async () => {};
export const updateUserProfile = async () => {};

// --- FIRESTORE POLYFILL ---
export const db = { name: "local_mock_db" };

export const collection = (db, colName) => ({ type: 'collection', colName });
export const doc = (db, colName, docId) => {
  if (arguments.length === 2 && typeof db === 'object' && db.type === 'collection') {
     return { type: 'doc', colName: db.colName, docId: colName };
  }
  return { type: 'doc', colName, docId };
};

export const query = (col, ...clauses) => {
  return { type: 'query', col, clauses };
};

export const where = (field, op, val) => ({ type: 'where', field, op, val });
export const orderBy = (field, dir) => ({ type: 'orderBy', field, dir });

const fetchAllMails = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/mail');
    if(res.ok) {
       const data = await res.json();
       return data.emails || [];
    }
  } catch(e) {}
  return [];
};

export const onSnapshot = (q, cb) => {
  let active = true;
  
  const poll = async () => {
     if(!active) return;
     let mails = await fetchAllMails();
     
     if (q.type === 'query') {
        const { col, clauses } = q;
        if (col.colName !== 'emails') { cb({ docs: [] }); return; }
        
        for (let c of clauses) {
           if (c.type === 'where') {
              mails = mails.filter(m => {
                 if(c.op === '==') return m[c.field] === c.val;
                 if(c.op === 'in') return Array.isArray(c.val) && c.val.includes(m[c.field]);
                 if(c.op === 'array-contains') return Array.isArray(m[c.field]) && m[c.field].includes(c.val);
                 if(c.op === '!=') return m[c.field] !== c.val;
                 return true;
              });
           }
        }
        
        const orderClause = clauses.find(c => c.type === 'orderBy');
        if (orderClause) {
           mails.sort((a,b) => {
              const av = a[orderClause.field];
              const bv = b[orderClause.field];
              if (orderClause.dir === 'desc') return av > bv ? -1 : 1;
              return av > bv ? 1 : -1;
           });
        }
     }
     
     const snapshot = {
        docs: mails.map(m => ({
           id: m.id,
           data: () => m,
           exists: () => true,
           ref: { id: m.id }
        }))
     };
     
     cb(snapshot);
  };
  
  poll();
  const interval = setInterval(poll, 3000);
  return () => { active = false; clearInterval(interval); };
};

export const getDoc = async (docRef) => {
  if(docRef.colName === 'users') {
    return { exists: () => true, data: () => ({ aliases: [_currentUser?.email] }) };
  }
  const mails = await fetchAllMails();
  const found = mails.find(m => m.id === docRef.docId);
  return {
    id: docRef.docId,
    exists: () => !!found,
    data: () => found,
    ref: { id: docRef.docId }
  };
};

export const getDocs = async (q) => {
   return new Promise(resolve => {
      const unsub = onSnapshot(q, snap => {
         unsub();
         resolve(snap);
      });
   });
};

export const setDoc = async (docRef, data, opts) => {
   if(docRef.colName === 'users') return; // ignore users
   data.id = docRef.docId;
   await fetch('http://localhost:3001/api/mail', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
};

export const addDoc = async (colRef, data) => {
   if(colRef.colName === 'users') return { id: 'mock' };
   data.id = Math.random().toString(36).substring(2,15);
   await fetch('http://localhost:3001/api/mail', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
   return { id: data.id };
};

export const updateDoc = async (docRef, data) => {
   if(docRef.colName === 'users') return;
   const curr = await getDoc(docRef);
   if (curr.exists()) {
      const merged = { ...curr.data(), ...data };
      await fetch('http://localhost:3001/api/mail', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(merged) });
   }
};

export const deleteDoc = async (docRef) => {
   if(docRef.colName === 'users') return;
   const curr = await getDoc(docRef);
   if (curr.exists()) {
      // Fake deletion by changing folder to trash and marking deleted
      const merged = { ...curr.data(), folder: 'trash', deletedLocally: true };
      await fetch('http://localhost:3001/api/mail', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(merged) });
   }
};

export const serverTimestamp = () => new Date().toISOString();
export const arrayUnion = (val) => val;
export const arrayRemove = (val) => val;
export const writeBatch = () => ({ commit: async () => {}, update: () => {} });

// --- STORAGE POLYFILL ---
export const storage = { name: "local_mock_storage" };
export const ref = () => ({});
export const uploadBytes = async () => ({});
export const getDownloadURL = async () => "https://via.placeholder.com/150";
