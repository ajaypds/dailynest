import React, { useEffect, useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { useSelector } from 'react-redux';
import { selectUser } from '../features/auth/authSlice';

const DebugHousehold = () => {
    const { currentHousehold } = useHousehold();
    const user = useSelector(selectUser);

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Debug Household</h1>
            <div className="bg-gray-100 p-4 rounded overflow-auto">
                <pre id="debug-info">
                    {JSON.stringify({
                        user: { uid: user?.uid, email: user?.email },
                        currentHousehold
                    }, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default DebugHousehold;
