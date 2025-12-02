import {
    collection,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp,
    getDocs,
    limit,
    startAfter,
    setDoc,
    arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';

const ITEMS_COLLECTION = 'items';
const TYPES_COLLECTION = 'types';
const UNITS_COLLECTION = 'units';

// Helper to serialize Firestore timestamps
const serializeItem = (doc) => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        dueDate: data.dueDate?.toDate ? data.dueDate.toDate().toISOString() : data.dueDate,
        purchasedAt: data.purchasedAt?.toDate ? data.purchasedAt.toDate().toISOString() : data.purchasedAt,
    };
};

export const addItem = async (itemData, userId, householdId) => {
    try {
        const docRef = await addDoc(collection(db, ITEMS_COLLECTION), {
            ...itemData,
            createdBy: userId,
            householdId: householdId,
            createdAt: serverTimestamp(),
            status: itemData.status || 'pending', // pending, completed
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding item: ", error);
        throw error;
    }
};

export const updateItem = async (itemId, data) => {
    try {
        const itemRef = doc(db, ITEMS_COLLECTION, itemId);
        await updateDoc(itemRef, data);
    } catch (error) {
        console.error("Error updating item: ", error);
        throw error;
    }
};

export const deleteItem = async (itemId) => {
    try {
        await deleteDoc(doc(db, ITEMS_COLLECTION, itemId));
    } catch (error) {
        console.error("Error deleting item: ", error);
        throw error;
    }
};

export const subscribeToItems = (callback, householdId) => {
    if (!householdId) return () => { };

    const q = query(
        collection(db, ITEMS_COLLECTION),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(serializeItem);
        callback(items);
    }, (error) => {
        console.error("Error subscribing to items:", error);
    });
};

export const subscribeToPendingItems = (callback, householdId) => {
    if (!householdId) return () => { };

    const q = query(
        collection(db, ITEMS_COLLECTION),
        where('householdId', '==', householdId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(serializeItem);
        callback(items);
    }, (error) => {
        console.error("Error subscribing to pending items:", error);
    });
};

export const fetchCompletedItems = async ({ lastDoc = null, pageSize = 20, householdId }) => {
    try {
        if (!householdId) return { items: [], lastDoc: null };

        let q = query(
            collection(db, ITEMS_COLLECTION),
            where('householdId', '==', householdId),
            where('status', '==', 'completed'),
            orderBy('purchasedAt', 'desc'),
            limit(pageSize)
        );

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({
            ...serializeItem(doc),
            doc // Keep the doc reference for pagination
        }));

        const lastVisible = snapshot.docs[snapshot.docs.length - 1];

        return {
            items,
            lastDoc: lastVisible
        };
    } catch (error) {
        console.error("Error fetching completed items:", error);
        throw error;
    }
};

export const subscribeToCompletedItems = (callback, householdId) => {
    if (!householdId) return () => { };

    const q = query(
        collection(db, ITEMS_COLLECTION),
        where('householdId', '==', householdId),
        where('status', '==', 'completed'),
        orderBy('purchasedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(serializeItem);
        callback(items);
    }, (error) => {
        console.error("Error subscribing to completed items:", error);
    });
};

export const saveUserToken = async (userId, token) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            fcmToken: token,
            lastLogin: serverTimestamp()
        });
    } catch (error) {
        console.error("Error saving user token:", error);
    }
};

export const syncUserProfile = async (user) => {
    if (!user) return;
    try {
        const userRef = doc(db, 'users', user.uid);
        // Use setDoc with merge: true to create if not exists or update
        await setDoc(userRef, {
            displayName: user.displayName || 'User',
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error syncing user profile:", error);
    }
};

// Fetch item types from Firestore
// Fetch item types from Firestore
export const getItemTypes = async (householdId) => {
    try {
        if (!householdId) return ['Grocery', 'Vegetables', 'Fruits', 'Snacks', 'Household', 'Misc'];

        const q = query(collection(db, TYPES_COLLECTION), where('householdId', '==', householdId));
        const querySnapshot = await getDocs(q);
        const types = querySnapshot.docs.map(doc => doc.data().name);
        return types.sort();
    } catch (error) {
        console.error("Error fetching types:", error);
        return ['Grocery', 'Vegetables', 'Fruits', 'Snacks', 'Household', 'Misc'];
    }
};

// Fetch units from Firestore
// Fetch units from Firestore
export const getUnits = async (householdId) => {
    try {
        if (!householdId) return ['Ltr', 'KG', 'Grams', 'Packet', 'Piece', 'Dozen', 'Box'];

        const q = query(collection(db, UNITS_COLLECTION), where('householdId', '==', householdId));
        const querySnapshot = await getDocs(q);
        const units = querySnapshot.docs.map(doc => doc.data().name);
        return units.sort();
    } catch (error) {
        console.error("Error fetching units:", error);
        return ['Ltr', 'KG', 'Grams', 'Packet', 'Piece', 'Dozen', 'Box'];
    }
};

// Subscribe to types collection for real-time updates
// Subscribe to types collection for real-time updates
export const subscribeToTypes = (callback, householdId) => {
    if (!householdId) return () => { };

    const q = query(collection(db, TYPES_COLLECTION), where('householdId', '==', householdId), orderBy('name'));

    return onSnapshot(q, (snapshot) => {
        const types = snapshot.docs.map(doc => doc.data().name);
        callback(types);
    }, (error) => {
        console.error("Error subscribing to types:", error);
    });
};

// Subscribe to units collection for real-time updates
// Subscribe to units collection for real-time updates
export const subscribeToUnits = (callback, householdId) => {
    if (!householdId) return () => { };

    const q = query(collection(db, UNITS_COLLECTION), where('householdId', '==', householdId), orderBy('name'));

    return onSnapshot(q, (snapshot) => {
        const units = snapshot.docs.map(doc => doc.data().name);
        callback(units);
    }, (error) => {
        console.error("Error subscribing to units:", error);
    });
};

// Add a new type
// Add a new type
export const addType = async (typeName, householdId) => {
    try {
        await addDoc(collection(db, TYPES_COLLECTION), {
            name: typeName,
            householdId: householdId
        });
    } catch (error) {
        console.error("Error adding type:", error);
        throw error;
    }
};

// Add a new unit
// Add a new unit
export const addUnit = async (unitName, householdId) => {
    try {
        await addDoc(collection(db, UNITS_COLLECTION), {
            name: unitName,
            householdId: householdId
        });
    } catch (error) {
        console.error("Error adding unit:", error);
        throw error;
    }
};

// Delete a type
export const deleteType = async (typeId) => {
    try {
        await deleteDoc(doc(db, TYPES_COLLECTION, typeId));
    } catch (error) {
        console.error("Error deleting type:", error);
        throw error;
    }
};

// Delete a unit
export const deleteUnit = async (unitId) => {
    try {
        await deleteDoc(doc(db, UNITS_COLLECTION, unitId));
    } catch (error) {
        console.error("Error deleting unit:", error);
        throw error;
    }
};

// Subscribe to types with IDs for editing/deleting
// Subscribe to types with IDs for editing/deleting
export const subscribeToTypesWithIds = (callback, householdId) => {
    if (!householdId) return () => { };

    const q = query(collection(db, TYPES_COLLECTION), where('householdId', '==', householdId), orderBy('name'));

    return onSnapshot(q, (snapshot) => {
        const types = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        }));
        callback(types);
    }, (error) => {
        console.error("Error subscribing to types:", error);
    });
};

// Subscribe to units with IDs for editing/deleting
// Subscribe to units with IDs for editing/deleting
export const subscribeToUnitsWithIds = (callback, householdId) => {
    if (!householdId) return () => { };

    const q = query(collection(db, UNITS_COLLECTION), where('householdId', '==', householdId), orderBy('name'));

    return onSnapshot(q, (snapshot) => {
        const units = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        }));
        callback(units);
    }, (error) => {
        console.error("Error subscribing to units:", error);
    });
};

// --- Invitation & Sharing Functions ---

export const sendInvitation = async (fromUserId, fromEmail, toEmail, householdId) => {
    try {
        // Check if invitation already exists
        const q = query(
            collection(db, 'invitations'),
            where('householdId', '==', householdId),
            where('toEmail', '==', toEmail),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            throw new Error('Invitation already sent to this email.');
        }

        await addDoc(collection(db, 'invitations'), {
            fromUser: fromUserId,
            fromEmail: fromEmail,
            toEmail: toEmail,
            householdId: householdId,
            status: 'pending',
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending invitation:", error);
        throw error;
    }
};

export const subscribeToInvitations = (userEmail, callback) => {
    if (!userEmail) return () => { };

    const q = query(
        collection(db, 'invitations'),
        where('toEmail', '==', userEmail),
        where('status', '==', 'pending')
    );

    return onSnapshot(q, (snapshot) => {
        const invitations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(invitations);
    }, (error) => {
        console.error("Error subscribing to invitations:", error);
    });
};

export const acceptInvitation = async (invitationId, userId, householdId) => {
    try {
        // 1. Add user to household members using arrayUnion
        // We don't need to read the doc first, which avoids permission issues for non-members
        const householdRef = doc(db, 'households', householdId);
        await updateDoc(householdRef, {
            members: arrayUnion(userId)
        });

        // 2. Delete the invitation (or mark accepted)
        await deleteDoc(doc(db, 'invitations', invitationId));

    } catch (error) {
        console.error("Error accepting invitation:", error);
        throw error;
    }
};

export const rejectInvitation = async (invitationId) => {
    try {
        await deleteDoc(doc(db, 'invitations', invitationId));
    } catch (error) {
        console.error("Error rejecting invitation:", error);
        throw error;
    }
};

export const subscribeToHouseholdMembers = (householdId, callback) => {
    if (!householdId) return () => { };

    const householdRef = doc(db, 'households', householdId);
    return onSnapshot(householdRef, async (docSnap) => {
        if (docSnap.exists()) {
            const memberIds = docSnap.data().members || [];
            // Fetch user details for these IDs
            // This is tricky because we can't query 'users' collection by array of IDs easily if > 10
            // and we might not have read access to all users.
            // But our rules say: allow read, write: if isAuthenticated() && request.auth.uid == userId;
            // So we CANNOT fetch other users' profiles unless we change rules or store member info in household.

            // For now, let's assume we can't fetch names. We will just show IDs or emails if stored.
            // Wait, we need to show who the members are.
            // We should probably store a display name map in the household document or allow reading public profiles.
            // Let's update the household doc to store member details (id, email/name) when they join?
            // Or change rules to allow reading basic user profile (displayName, email) for authenticated users?

            // Let's change rules to allow reading specific fields of users? No, Firestore rules are document level.
            // We can make a 'public_profiles' collection or just allow reading 'users' if authenticated.
            // The current rule is: match /users/{userId} { allow read, write: if isAuthenticated() && request.auth.uid == userId; }
            // This prevents seeing other members.

            // I will update the rules to allow reading any user profile if authenticated (for now) or just member profiles.
            // For this step, I'll just return the IDs.
            callback(memberIds);
        }
    });
};

export const removeMember = async (householdId, userId) => {
    try {
        const householdRef = doc(db, 'households', householdId);
        const hDoc = await import('firebase/firestore').then(m => m.getDoc(householdRef));
        if (hDoc.exists()) {
            const currentMembers = hDoc.data().members || [];
            const newMembers = currentMembers.filter(id => id !== userId);
            await updateDoc(householdRef, {
                members: newMembers
            });
        }
    } catch (error) {
        console.error("Error removing member:", error);
        throw error;
    }
};

export const updateHouseholdName = async (householdId, newName) => {
    try {
        const householdRef = doc(db, 'households', householdId);
        await updateDoc(householdRef, {
            name: newName
        });
    } catch (error) {
        console.error("Error updating household name:", error);
        throw error;
    }
};

export const setDefaultHousehold = async (userId, householdId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            defaultHouseholdId: householdId
        });
    } catch (error) {
        console.error("Error setting default household:", error);
        throw error;
    }
};

export const updateLastActiveHousehold = async (userId, householdId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            lastActiveHouseholdId: householdId
        });
    } catch (error) {
        console.error("Error updating last active household:", error);
        // Don't throw, just log. This is a preference update, not critical.
    }
};

export const createHousehold = async (userId, householdName) => {
    try {
        // 1. Create the household document
        const householdRef = await addDoc(collection(db, 'households'), {
            name: householdName,
            ownerId: userId,
            members: [userId],
            createdAt: serverTimestamp()
        });

        // 2. Set as default and last active for the user
        await setDefaultHousehold(userId, householdRef.id);
        await updateLastActiveHousehold(userId, householdRef.id);

        return householdRef.id;
    } catch (error) {
        console.error("Error creating household:", error);
        throw error;
    }
};
