import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectPendingItems } from '../features/items/itemsSlice';
import { updateItem } from '../services/firestoreService';
import { selectUser } from '../features/auth/authSlice';
import { ArrowLeft, Check } from 'lucide-react';
import { Input } from "@/components/ui/input";

const CompleteItem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const items = useSelector(selectPendingItems);
    const user = useSelector(selectUser);
    const item = items.find(i => i.id === id);

    const [price, setPrice] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!item && items.length > 0) {
            // Item not found in pending list (maybe already completed or invalid ID)
            // navigate('/'); // Optional: redirect if strict
        }
    }, [item, items, navigate]);

    if (!item) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Item not found or loading...</div>;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateItem(id, {
                price: Number(price),
                status: 'completed',
                purchasedBy: user.uid,
                purchasedAt: new Date(),
            });
            navigate('/');
        } catch (error) {
            console.error("Error completing item", error);
            alert("Failed to complete item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 p-4 shadow-md sticky top-0 z-10 flex items-center gap-4 text-gray-800 dark:text-gray-200">
                <button onClick={() => navigate(-1)} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition">
                    <ArrowLeft />
                </button>
                <h1 className="text-xl font-medium">Complete Purchase</h1>
            </header>

            <main className="p-4 max-w-md mx-auto mt-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{item.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{item.quantity} {item.unit} • {item.type}</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Price Paid</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">₹</span>
                            </div>
                            <Input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="pl-8 text-lg"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-70"
                    >
                        {loading ? 'Processing...' : <><Check size={20} /> Mark as Purchased</>}
                    </button>
                </form>
            </main>
        </div>
    );
};

export default CompleteItem;
