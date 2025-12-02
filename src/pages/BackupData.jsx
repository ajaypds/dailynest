import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const BackupData = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const itemsSnapshot = await getDocs(collection(db, 'items'));
                const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const typesSnapshot = await getDocs(collection(db, 'types'));
                const types = typesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const unitsSnapshot = await getDocs(collection(db, 'units'));
                const units = unitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                setData({ items, types, units });
            } catch (err) {
                console.error("Error fetching backup data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div>Loading backup data...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <pre id="backup-content">
            {JSON.stringify(data, null, 2)}
        </pre>
    );
};

export default BackupData;
