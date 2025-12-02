import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    subscribeToTypesWithIds,
    subscribeToUnitsWithIds,
    addType,
    addUnit,
    deleteType,
    deleteUnit,
    subscribeToInvitations,
    acceptInvitation,
    rejectInvitation
} from '../services/firestoreService';
import { ArrowLeft, Plus, Trash2, Users, Mail, Check, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useHousehold } from '../context/HouseholdContext';
import { useSelector } from 'react-redux';
import { selectUser } from '../features/auth/authSlice';

import { App } from '@capacitor/app';

const Settings = () => {
    const navigate = useNavigate();
    const [types, setTypes] = useState([]);
    const [units, setUnits] = useState([]);
    const [newType, setNewType] = useState('');
    const [newUnit, setNewUnit] = useState('');
    const [loading, setLoading] = useState({ type: false, unit: false });
    const [appVersion, setAppVersion] = useState('1.0.0');
    const { currentHousehold } = useHousehold();
    const user = useSelector(selectUser);
    const [invitations, setInvitations] = useState([]);

    useEffect(() => {
        const getAppVersion = async () => {
            try {
                const info = await App.getInfo();
                setAppVersion(`${info.version} (${info.build})`);
            } catch (error) {
                console.log('Error getting app info:', error);
                // Fallback for web dev if needed, though 1.0.0 default is fine
            }
        };
        getAppVersion();
    }, []);

    useEffect(() => {
        if (!user?.email) return;

        const unsubscribeInvitations = subscribeToInvitations(user.email, (invites) => {
            setInvitations(invites);
        });

        if (!currentHousehold) return;

        const unsubscribeTypes = subscribeToTypesWithIds((fetchedTypes) => {
            setTypes(fetchedTypes);
        }, currentHousehold.id);

        const unsubscribeUnits = subscribeToUnitsWithIds((fetchedUnits) => {
            setUnits(fetchedUnits);
        }, currentHousehold.id);

        return () => {
            unsubscribeInvitations();
            unsubscribeTypes();
            unsubscribeUnits();
        };
    }, [currentHousehold, user]);

    const handleAcceptInvitation = async (invitation) => {
        try {
            await acceptInvitation(invitation.id, user.uid, invitation.householdId);
            alert('Invitation accepted!');
        } catch (error) {
            alert('Failed to accept invitation');
        }
    };

    const handleRejectInvitation = async (id) => {
        if (!confirm('Reject this invitation?')) return;
        try {
            await rejectInvitation(id);
        } catch (error) {
            alert('Failed to reject invitation');
        }
    };

    const handleAddType = async (e) => {
        e.preventDefault();
        if (!newType.trim()) return;

        setLoading({ ...loading, type: true });
        try {
            await addType(newType.trim(), currentHousehold.id);
            setNewType('');
        } catch (error) {
            alert('Failed to add type');
        } finally {
            setLoading({ ...loading, type: false });
        }
    };

    const handleAddUnit = async (e) => {
        e.preventDefault();
        if (!newUnit.trim()) return;

        setLoading({ ...loading, unit: true });
        try {
            await addUnit(newUnit.trim(), currentHousehold.id);
            setNewUnit('');
        } catch (error) {
            alert('Failed to add unit');
        } finally {
            setLoading({ ...loading, unit: false });
        }
    };

    const handleDeleteType = async (id) => {
        if (!confirm('Are you sure you want to delete this type?')) return;

        try {
            await deleteType(id);
        } catch (error) {
            alert('Failed to delete type');
        }
    };

    const handleDeleteUnit = async (id) => {
        if (!confirm('Are you sure you want to delete this unit?')) return;

        try {
            await deleteUnit(id);
        } catch (error) {
            alert('Failed to delete unit');
        }
    };

    return (
        <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 p-4 shadow-md sticky top-0 z-10 flex items-center gap-4 text-gray-800 dark:text-gray-200">
                <button onClick={() => navigate(-1)} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition">
                    <ArrowLeft />
                </button>
                <h1 className="text-xl font-medium">Settings</h1>
            </header>

            <main className="p-6 max-w-2xl mx-auto space-y-8">

                {/* Access Management Link */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Sharing & Access</h2>
                    <button
                        onClick={() => navigate('/manage-access')}
                        className="w-full flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition text-primary-700 dark:text-primary-300 font-medium"
                    >
                        <div className="flex items-center gap-3">
                            <Users size={20} />
                            <span>Manage Household Members</span>
                        </div>
                        <ArrowLeft className="rotate-180" size={20} />
                    </button>
                </section>

                {/* Invitations Section */}
                {invitations.length > 0 && (
                    <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <Mail size={20} /> Pending Invitations
                        </h2>
                        <div className="space-y-3">
                            {invitations.map(invite => (
                                <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">Invitation to join a household</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            From: {invite.fromEmail || `User ID: ${invite.fromUser}`}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAcceptInvitation(invite)}
                                            className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition"
                                            title="Accept"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRejectInvitation(invite.id)}
                                            className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition"
                                            title="Reject"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Item Types Section */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Item Categories</h2>

                    <form onSubmit={handleAddType} className="flex gap-2 mb-4">
                        <Input
                            type="text"
                            value={newType}
                            onChange={(e) => setNewType(e.target.value)}
                            placeholder="Add new category..."
                            className="flex-1"
                        />
                        <button
                            type="submit"
                            disabled={loading.type || !newType.trim()}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add
                        </button>
                    </form>

                    <div className="space-y-2">
                        {types.length === 0 ? (
                            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No categories yet</p>
                        ) : (
                            types.map((type) => (
                                <div
                                    key={type.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                >
                                    <span className="text-gray-800 dark:text-gray-200">{type.name}</span>
                                    <button
                                        onClick={() => handleDeleteType(type.id)}
                                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Units Section */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Units</h2>

                    <form onSubmit={handleAddUnit} className="flex gap-2 mb-4">
                        <Input
                            type="text"
                            value={newUnit}
                            onChange={(e) => setNewUnit(e.target.value)}
                            placeholder="Add new unit..."
                            className="flex-1"
                        />
                        <button
                            type="submit"
                            disabled={loading.unit || !newUnit.trim()}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add
                        </button>
                    </form>

                    <div className="space-y-2">
                        {units.length === 0 ? (
                            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No units yet</p>
                        ) : (
                            units.map((unit) => (
                                <div
                                    key={unit.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                >
                                    <span className="text-gray-800 dark:text-gray-200">{unit.name}</span>
                                    <button
                                        onClick={() => handleDeleteUnit(unit.id)}
                                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <div className="text-center pt-8 pb-4">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        App Version {appVersion}
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Settings;
