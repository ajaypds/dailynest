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
    startAfter
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

export const addItem = async (itemData, userId) => {
    try {
        const docRef = await addDoc(collection(db, ITEMS_COLLECTION), {
            ...itemData,
            createdBy: userId,
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

export const subscribeToItems = (callback) => {
    const q = query(
        collection(db, ITEMS_COLLECTION),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(serializeItem);
        callback(items);
    }, (error) => {
        console.error("Error subscribing to items:", error);
    });
};

export const subscribeToPendingItems = (callback) => {
    const q = query(
        collection(db, ITEMS_COLLECTION),
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

export const fetchCompletedItems = async ({ lastDoc = null, pageSize = 20 }) => {
    try {
        let q = query(
            collection(db, ITEMS_COLLECTION),
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

export const subscribeToCompletedItems = (callback) => {
    const q = query(
        collection(db, ITEMS_COLLECTION),
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

// Fetch item types from Firestore
export const getItemTypes = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, TYPES_COLLECTION));
        const types = querySnapshot.docs.map(doc => doc.data().name);
        return types.sort();
    } catch (error) {
        console.error("Error fetching types:", error);
        return ['Grocery', 'Vegetables', 'Fruits', 'Snacks', 'Household', 'Misc'];
    }
};

// Fetch units from Firestore
export const getUnits = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, UNITS_COLLECTION));
        const units = querySnapshot.docs.map(doc => doc.data().name);
        return units.sort();
    } catch (error) {
        console.error("Error fetching units:", error);
        return ['Ltr', 'KG', 'Grams', 'Packet', 'Piece', 'Dozen', 'Box'];
    }
};

// Subscribe to types collection for real-time updates
export const subscribeToTypes = (callback) => {
    const q = query(collection(db, TYPES_COLLECTION), orderBy('name'));

    return onSnapshot(q, (snapshot) => {
        const types = snapshot.docs.map(doc => doc.data().name);
        callback(types);
    }, (error) => {
        console.error("Error subscribing to types:", error);
    });
};

// Subscribe to units collection for real-time updates
export const subscribeToUnits = (callback) => {
    const q = query(collection(db, UNITS_COLLECTION), orderBy('name'));

    return onSnapshot(q, (snapshot) => {
        const units = snapshot.docs.map(doc => doc.data().name);
        callback(units);
    }, (error) => {
        console.error("Error subscribing to units:", error);
    });
};

// Add a new type
export const addType = async (typeName) => {
    try {
        await addDoc(collection(db, TYPES_COLLECTION), {
            name: typeName
        });
    } catch (error) {
        console.error("Error adding type:", error);
        throw error;
    }
};

// Add a new unit
export const addUnit = async (unitName) => {
    try {
        await addDoc(collection(db, UNITS_COLLECTION), {
            name: unitName
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
export const subscribeToTypesWithIds = (callback) => {
    const q = query(collection(db, TYPES_COLLECTION), orderBy('name'));

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
export const subscribeToUnitsWithIds = (callback) => {
    const q = query(collection(db, UNITS_COLLECTION), orderBy('name'));

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
