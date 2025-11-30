import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { subscribeToPendingItems, updateItem, subscribeToUnits, subscribeToTypes } from '../services/firestoreService';
import { setItems, selectPendingItems } from '../features/items/itemsSlice';
import { logout, selectUser } from '../features/auth/authSlice';
import { auth } from '../config/firebase';
import { LogOut, Plus, CheckCircle, ShoppingCart, PieChart, ShoppingBag, Pencil, X, Save, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dayjs from 'dayjs';

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const items = useSelector(selectPendingItems);
    const user = useSelector(selectUser);
    const { isDark, toggleTheme } = useTheme();

    const [editingId, setEditingId] = useState(null);
    const [units, setUnits] = useState(['Piece']);
    const [types, setTypes] = useState(['Grocery']);
    const [editForm, setEditForm] = useState({
        name: '',
        quantity: '',
        unit: '',
        type: '',
        note: ''
    });

    // Fetch units and types from Firestore
    useEffect(() => {
        const unsubscribeUnits = subscribeToUnits((fetchedUnits) => {
            setUnits(fetchedUnits);
        });

        const unsubscribeTypes = subscribeToTypes((fetchedTypes) => {
            setTypes(fetchedTypes);
        });

        return () => {
            unsubscribeUnits();
            unsubscribeTypes();
        };
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToPendingItems((fetchedItems) => {
            dispatch(setItems(fetchedItems));
        });
        return () => unsubscribe();
    }, [dispatch]);

    const handleLogout = () => {
        auth.signOut();
        dispatch(logout());
    };

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setEditForm({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            type: item.type,
            note: item.note || ''
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({ name: '', quantity: '', unit: '', type: '', note: '' });
    };

    const handleSaveEdit = async () => {
        if (!editForm.name || !editForm.quantity) return;

        try {
            await updateItem(editingId, {
                name: editForm.name,
                quantity: Number(editForm.quantity),
                unit: editForm.unit,
                type: editForm.type,
                note: editForm.note
            });
            setEditingId(null);
        } catch (error) {
            console.error("Failed to update item", error);
            alert("Failed to update item");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const getDisplayName = (user) => {
        if (user?.displayName) return user.displayName.split(' ')[0];

        if (user?.email) {
            const email = user.email.toLowerCase();
            if (email.includes('ajay')) return 'Ajay';
            if (email.includes('wife')) return 'Puja';

            // Fallback: Capitalize first part of email
            const namePart = email.split('@')[0];
            return namePart.charAt(0).toUpperCase() + namePart.slice(1);
        }

        return 'User';
    };

    return (
        <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-24">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-primary-800 dark:text-primary-400">DailyNest</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Welcome, {getDisplayName(user)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition">
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button onClick={() => navigate('/settings')} className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition">
                        <SettingsIcon size={20} />
                    </button>
                    <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Pending Items</h2>
                    <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs px-2 py-1 rounded-full font-medium">
                        {items.length} items
                    </span>
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                        <ShoppingCart size={48} className="mb-4 opacity-20" />
                        <p>All caught up! No pending items.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                {editingId === item.id ? (
                                    // Edit Mode
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Item Name</label>
                                            <Input
                                                type="text"
                                                name="name"
                                                value={editForm.name}
                                                onChange={handleChange}
                                                placeholder="Item Name"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-1/3 space-y-1">
                                                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Qty</label>
                                                <Input
                                                    type="number"
                                                    name="quantity"
                                                    value={editForm.quantity}
                                                    onChange={handleChange}
                                                    placeholder="0"
                                                    step="0.1"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Unit</label>
                                                <Select value={editForm.unit} onValueChange={(value) => setEditForm(prev => ({ ...prev, unit: value }))}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Category</label>
                                            <Select value={editForm.type} onValueChange={(value) => setEditForm(prev => ({ ...prev, type: value }))}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Note (Optional)</label>
                                            <Input
                                                type="text"
                                                name="note"
                                                value={editForm.note}
                                                onChange={handleChange}
                                                placeholder="Add a note..."
                                                className="italic text-gray-600 dark:text-gray-300"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-2">
                                            <button
                                                onClick={handleCancelEdit}
                                                className="px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveEdit}
                                                className="px-6 py-2 rounded-lg text-white bg-primary-600 hover:bg-primary-700 font-medium shadow-sm transition flex items-center gap-2"
                                            >
                                                <Save size={18} /> Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
                                                <button
                                                    onClick={() => handleEditClick(item)}
                                                    className="text-gray-300 dark:text-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">{item.type}</span>
                                                <span>•</span>
                                                <span>{item.quantity} {item.unit}</span>
                                            </div>
                                            {item.dueDate && (
                                                <p className="text-xs text-orange-600 mt-1">Due: {dayjs(item.dueDate).format('MMM D')}</p>
                                            )}
                                            {item.note && (
                                                <p className="text-xs text-gray-400 mt-1 italic">"{item.note}"</p>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => navigate(`/complete/${item.id}`)}
                                            className="p-3 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition ml-3"
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* FABs */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-4 items-end">
                <button
                    onClick={() => navigate('/history')}
                    className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-3 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-600"
                    title="History"
                >
                    <span className="sr-only">History</span>
                    <ShoppingBag size={24} />
                </button>

                <button
                    onClick={() => navigate('/reports')}
                    className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-3 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-600"
                    title="Reports"
                >
                    <span className="sr-only">Reports</span>
                    <PieChart size={24} />
                </button>

                <button
                    onClick={() => navigate('/manual')}
                    className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-600"
                    title="Quick Expense"
                >
                    <span className="sr-only">Quick Expense</span>
                    <span className="text-xl font-bold">₹</span>
                </button>

                <button
                    onClick={() => navigate('/add')}
                    className="bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition hover:scale-105 active:scale-95"
                >
                    <Plus size={24} />
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
