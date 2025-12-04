import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { subscribeToPendingItems, updateItem, subscribeToUnits, subscribeToTypes } from '../services/firestoreService';
import { setItems, selectPendingItems } from '../features/items/itemsSlice';
import { logout, selectUser } from '../features/auth/authSlice';
import { auth } from '../config/firebase';
import { LogOut, Plus, CheckCircle, ShoppingCart, PieChart, ShoppingBag, Pencil, X, Save, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useHousehold } from '../context/HouseholdContext';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import dayjs from 'dayjs';

const UserAvatar = ({ user }) => {
    if (user?.photoURL) {
        return <img src={user.photoURL} alt="User" className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 object-cover" />;
    }

    const email = user?.email || 'User';
    const initial = email.charAt(0).toUpperCase();

    // Simple consistent color based on char code
    const colors = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    const colorIndex = (email.charCodeAt(0) + email.length) % colors.length;
    const bgColor = colors[colorIndex];

    return (
        <div className={`${bgColor} w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm border border-white dark:border-gray-800 shadow-sm`}>
            {initial}
        </div>
    );
};

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const items = useSelector(selectPendingItems);
    const user = useSelector(selectUser);
    const { isDark, toggleTheme } = useTheme();
    const { currentHousehold, loading: householdLoading } = useHousehold();

    const [editingId, setEditingId] = useState(null);
    const [units, setUnits] = useState(['Piece']);
    const [types, setTypes] = useState(['Grocery']);
    const [editForm, setEditForm] = useState({
        name: '',
        quantity: '',
        unit: '',
        type: '',
        note: '',
        dueDate: ''
    });

    // Fetch units and types from Firestore
    // Fetch units and types from Firestore
    useEffect(() => {
        if (!currentHousehold) return;

        const unsubscribeUnits = subscribeToUnits((fetchedUnits) => {
            setUnits(fetchedUnits);
        }, currentHousehold.id);

        const unsubscribeTypes = subscribeToTypes((fetchedTypes) => {
            setTypes(fetchedTypes);
        }, currentHousehold.id);

        return () => {
            unsubscribeUnits();
            unsubscribeTypes();
        };
    }, [currentHousehold]);

    useEffect(() => {
        if (!currentHousehold) return;

        const unsubscribe = subscribeToPendingItems((fetchedItems) => {
            dispatch(setItems(fetchedItems));
        }, currentHousehold.id);
        return () => unsubscribe();
    }, [dispatch, currentHousehold]);

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
            note: item.note || '',
            dueDate: item.dueDate || ''
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({ name: '', quantity: '', unit: '', type: '', note: '', dueDate: '' });
    };

    const handleSaveEdit = async () => {
        if (!editForm.name || !editForm.quantity) return;

        try {
            await updateItem(editingId, {
                name: editForm.name,
                quantity: Number(editForm.quantity),
                unit: editForm.unit,
                type: editForm.type,
                note: editForm.note,
                dueDate: editForm.dueDate ? new Date(editForm.dueDate) : null
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
                    <div className="flex flex-col">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Welcome, {getDisplayName(user)}</p>
                        <p className="text-xs font-medium text-primary-600 dark:text-primary-400">{currentHousehold?.name}</p>
                    </div>
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                            <UserAvatar user={user} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="end">
                        <div className="flex flex-col gap-1">
                            <div className="px-2 py-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 mb-1">
                                {user?.email}
                            </div>

                            <button
                                onClick={toggleTheme}
                                className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition w-full text-left"
                            >
                                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                            </button>

                            <button
                                onClick={() => navigate('/settings')}
                                className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition w-full text-left"
                            >
                                <SettingsIcon size={16} />
                                <span>Settings</span>
                            </button>

                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-2 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition w-full text-left"
                            >
                                <LogOut size={16} />
                                <span>Log Out</span>
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>
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
                                            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Due Date</label>
                                            <DatePicker
                                                date={editForm.dueDate ? new Date(editForm.dueDate) : undefined}
                                                setDate={(date) => setEditForm(prev => ({ ...prev, dueDate: date ? format(date, 'yyyy-MM-dd') : '' }))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Note (Optional)</label>
                                            <Textarea
                                                name="note"
                                                value={editForm.note}
                                                onChange={handleChange}
                                                placeholder="Add a note..."
                                                className="italic text-gray-600 dark:text-gray-300"
                                                rows={2}
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
