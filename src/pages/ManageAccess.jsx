import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../features/auth/authSlice';
import { useHousehold } from '../context/HouseholdContext';
import {
    subscribeToHouseholdMembers,
    sendInvitation,
    removeMember,
    subscribeToInvitations,
    updateHouseholdName,
    setDefaultHousehold
} from '../services/firestoreService';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, UserPlus, Trash2, Users, Mail, Check, X, Pencil, Star } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ManageAccess = () => {
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const { currentHousehold, households, switchHousehold } = useHousehold();

    const [members, setMembers] = useState([]);
    const [memberDetails, setMemberDetails] = useState({});
    const [inviteEmail, setInviteEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [defaultHouseholdId, setDefaultHouseholdId] = useState(null);

    useEffect(() => {
        if (currentHousehold) {
            setNewName(currentHousehold.name || 'My Household');
        }
    }, [currentHousehold]);

    // Subscribe to user's profile to get default household
    useEffect(() => {
        if (!user?.uid) return;

        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
            if (docSnap.exists()) {
                setDefaultHouseholdId(docSnap.data().defaultHouseholdId);
            }
        });

        return () => unsubscribe();
    }, [user]);

    // Subscribe to members of current household
    useEffect(() => {
        if (!currentHousehold) return;

        const unsubscribe = subscribeToHouseholdMembers(currentHousehold.id, async (memberIds) => {
            setMembers(memberIds);

            // Fetch details for each member
            const details = {};
            for (const id of memberIds) {
                if (memberDetails[id]) {
                    details[id] = memberDetails[id];
                    continue;
                }
                try {
                    const userDoc = await getDoc(doc(db, 'users', id));
                    if (userDoc.exists()) {
                        details[id] = userDoc.data();
                    } else {
                        details[id] = { displayName: 'Unknown User', email: 'N/A' };
                    }
                } catch (err) {
                    console.error(`Error fetching user ${id}:`, err);
                    details[id] = { displayName: 'Error', email: 'Error' };
                }
            }
            setMemberDetails(prev => ({ ...prev, ...details }));
        });

        return () => unsubscribe();
    }, [currentHousehold]);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await sendInvitation(user.uid, user.email, inviteEmail.trim(), currentHousehold.id);
            setSuccess(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
        } catch (err) {
            setError(err.message || 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            await removeMember(currentHousehold.id, memberId);
        } catch (err) {
            alert('Failed to remove member');
        }
    };

    const handleRename = async () => {
        if (!newName.trim()) return;
        try {
            await updateHouseholdName(currentHousehold.id, newName.trim());
            setIsEditingName(false);
        } catch (err) {
            alert('Failed to rename household');
        }
    };

    const handleSetDefault = async (householdId) => {
        try {
            await setDefaultHousehold(user.uid, householdId);
            setDefaultHouseholdId(householdId);
            alert('Default household updated');
        } catch (err) {
            alert('Failed to set default household');
        }
    };

    const isOwner = currentHousehold?.ownerId === user?.uid;

    return (
        <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-20">
            <header className="bg-white dark:bg-gray-800 p-4 shadow-md sticky top-0 z-10 flex items-center gap-4 text-gray-800 dark:text-gray-200">
                <button onClick={() => navigate(-1)} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition">
                    <ArrowLeft />
                </button>
                <h1 className="text-xl font-medium">Manage Access</h1>
            </header>

            <main className="p-6 max-w-2xl mx-auto space-y-8">

                {/* Household Switcher */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Users size={20} /> Households
                        </h2>
                    </div>

                    {/* Current Household Name & Rename */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Household</p>
                        <div className="flex items-center gap-2">
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="border rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                                    />
                                    <button onClick={handleRename} className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200">
                                        <Check size={18} />
                                    </button>
                                    <button onClick={() => setIsEditingName(false)} className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200">
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{currentHousehold?.name || 'Household'}</h3>
                                    <button onClick={() => setIsEditingName(true)} className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                                        <Pencil size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        {households.map(h => (
                            <div key={h.id} className="flex items-center gap-2">
                                <button
                                    onClick={() => switchHousehold(h.id)}
                                    className={`flex-1 text-left p-3 rounded-lg transition flex justify-between items-center ${currentHousehold?.id === h.id
                                        ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <span className={`font-medium ${currentHousehold?.id === h.id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {h.name || 'Household'}
                                    </span>
                                    {currentHousehold?.id === h.id && <Check size={18} className="text-primary-600" />}
                                </button>
                                <button
                                    onClick={() => handleSetDefault(h.id)}
                                    className={`p-3 rounded-lg transition ${defaultHouseholdId === h.id
                                        ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                        : 'text-gray-300 hover:text-yellow-400'
                                        }`}
                                    title="Set as Default"
                                >
                                    <Star size={20} fill={defaultHouseholdId === h.id ? "currentColor" : "none"} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Invite Section */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <UserPlus size={20} /> Invite Member
                    </h2>

                    <form onSubmit={handleInvite} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="email"
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="friend@example.com"
                                    required
                                    className="flex-1"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Mail size={18} />
                                    Send
                                </button>
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        {success && <p className="text-sm text-green-500">{success}</p>}
                    </form>
                </section>

                {/* Members List */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <Users size={20} /> Members ({members.length})
                    </h2>

                    <div className="space-y-3">
                        {members.map(memberId => {
                            const details = memberDetails[memberId] || {};
                            const isMe = memberId === user.uid;
                            const isHouseholdOwner = memberId === currentHousehold?.ownerId;

                            let displayName = details.displayName || 'Loading...';

                            // Check if name is generic or missing
                            const isGenericName = !details.displayName || details.displayName === 'User' || details.displayName === 'Unknown User';

                            if (isGenericName && details.email && details.email !== 'N/A' && details.email !== 'Error') {
                                // Generate from email: john.doe@example.com -> John Doe
                                displayName = details.email.split('@')[0]
                                    .split(/[._]/)
                                    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                                    .join(' ');
                            } else if (details.displayName === 'Unknown User') {
                                // Fallback if no email to generate from
                                displayName = isHouseholdOwner ? 'Owner (Profile not synced)' : 'Member (Profile not synced)';
                            }

                            return (
                                <div key={memberId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {displayName} {isMe && '(You)'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{details.email}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isHouseholdOwner && (
                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Owner</span>
                                        )}

                                        {/* Only owner can remove others. Cannot remove self here (leave instead). */}
                                        {isOwner && !isMe && (
                                            <button
                                                onClick={() => handleRemoveMember(memberId)}
                                                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition"
                                                title="Remove member"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ManageAccess;
