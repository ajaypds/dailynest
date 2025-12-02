import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useSelector } from 'react-redux';
import { selectUser } from '../features/auth/authSlice';

import { updateLastActiveHousehold } from '../services/firestoreService';

const HouseholdContext = createContext();

export const useHousehold = () => useContext(HouseholdContext);

export const HouseholdProvider = ({ children }) => {
    const user = useSelector(selectUser);
    const [currentHousehold, setCurrentHousehold] = useState(null);
    const [households, setHouseholds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setHouseholds([]);
            setCurrentHousehold(null);
            setLoading(false);
            return;
        }

        setLoading(true);

        // 1. Subscribe to households where user is a member
        const q = query(collection(db, 'households'), where('members', 'array-contains', user.uid));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const fetchedHouseholds = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setHouseholds(fetchedHouseholds);

            // 2. Determine current household
            if (fetchedHouseholds.length > 0) {
                let targetHousehold = null;

                // Priority 1: Check user's last active household from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();

                        // Check last active household
                        if (userData.lastActiveHouseholdId) {
                            const lastActive = fetchedHouseholds.find(h => h.id === userData.lastActiveHouseholdId);
                            // Verify user is still a member (fetchedHouseholds only contains households where user is a member)
                            if (lastActive) {
                                targetHousehold = lastActive;
                            }
                        }

                        // Priority 2: Check default household if no valid last active
                        if (!targetHousehold && userData.defaultHouseholdId) {
                            const defaultH = fetchedHouseholds.find(h => h.id === userData.defaultHouseholdId);
                            if (defaultH) {
                                targetHousehold = defaultH;
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error fetching user profile for household preference:", e);
                }

                // Priority 3: Local Storage (Fallback)
                if (!targetHousehold) {
                    const savedHouseholdId = localStorage.getItem(`currentHousehold_${user.uid}`);
                    targetHousehold = fetchedHouseholds.find(h => h.id === savedHouseholdId);
                }

                // Priority 4: Owned household or First available
                if (!targetHousehold) {
                    const ownedHousehold = fetchedHouseholds.find(h => h.ownerId === user.uid);
                    targetHousehold = ownedHousehold || fetchedHouseholds[0];
                }

                setCurrentHousehold(targetHousehold);
                if (targetHousehold) {
                    localStorage.setItem(`currentHousehold_${user.uid}`, targetHousehold.id);
                    // Ensure DB is in sync if we fell back to something else
                    updateLastActiveHousehold(user.uid, targetHousehold.id);
                }
            } else {
                setCurrentHousehold(null);
            }

            setLoading(false);
        }, (error) => {
            console.error("Error fetching households:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const switchHousehold = (householdId) => {
        const household = households.find(h => h.id === householdId);
        if (household) {
            setCurrentHousehold(household);
            if (user) {
                localStorage.setItem(`currentHousehold_${user.uid}`, household.id);
                updateLastActiveHousehold(user.uid, household.id);
            }
        }
    };

    const value = {
        currentHousehold,
        households,
        switchHousehold,
        loading
    };

    return (
        <HouseholdContext.Provider value={value}>
            {children}
        </HouseholdContext.Provider>
    );
};
