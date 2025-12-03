import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../features/auth/authSlice';
import { addItem, subscribeToTypes, subscribeToUnits } from '../services/firestoreService';
import { useHousehold } from '../context/HouseholdContext';
import { ArrowLeft, Check } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

const ManualEntry = () => {
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const { currentHousehold } = useHousehold();
    const [loading, setLoading] = useState(false);
    const [itemTypes, setItemTypes] = useState(['Grocery']);
    const [units, setUnits] = useState(['Piece']);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Grocery',
        quantity: 1,
        unit: 'Piece',
        price: '',
        purchasedAt: new Date().toISOString().split('T')[0],
        note: '',
    });

    // Fetch types and units from Firestore
    // Fetch types and units from Firestore
    useEffect(() => {
        if (!currentHousehold) return;

        const unsubscribeTypes = subscribeToTypes((types) => {
            setItemTypes(types);
            if (types.length > 0 && !types.includes(formData.type)) {
                setFormData(prev => ({ ...prev, type: types[0] }));
            }
        }, currentHousehold.id);

        const unsubscribeUnits = subscribeToUnits((fetchedUnits) => {
            setUnits(fetchedUnits);
            if (fetchedUnits.length > 0 && !fetchedUnits.includes(formData.unit)) {
                setFormData(prev => ({ ...prev, unit: fetchedUnits[0] }));
            }
        }, currentHousehold.id);

        return () => {
            unsubscribeTypes();
            unsubscribeUnits();
        };
    }, [currentHousehold]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price) return;

        setLoading(true);
        try {
            await addItem({
                name: formData.name,
                type: formData.type,
                quantity: Number(formData.quantity),
                unit: formData.unit,
                price: Number(formData.price),
                status: 'completed',
                purchasedBy: user.uid,
                purchasedAt: new Date(formData.purchasedAt),
                dueDate: new Date(formData.purchasedAt),
                note: formData.note,
            }, user.uid, currentHousehold.id);
            navigate('/');
        } catch (error) {
            console.error("Error adding manual entry", error);
            alert("Failed to add entry");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
            <header className="bg-white dark:bg-gray-800 p-4 shadow-md z-10 flex items-center gap-4 text-gray-800 dark:text-gray-200 flex-shrink-0">
                <button onClick={() => navigate(-1)} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition">
                    <ArrowLeft />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-xl font-medium">Quick Expense</h1>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{currentHousehold?.name}</span>
                </div>
            </header>


            <main className="flex-1 overflow-y-auto p-6">
                <div className="max-w-lg mx-auto pb-20">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="name">Item Name</Label>
                            <Input
                                id="name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Category</Label>
                            <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {itemTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Date</Label>
                            <DatePicker
                                date={formData.purchasedAt ? new Date(formData.purchasedAt) : undefined}
                                setDate={(date) => setFormData(prev => ({ ...prev, purchasedAt: date ? format(date, 'yyyy-MM-dd') : '' }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                min="0.1"
                                step="0.1"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Select value={formData.unit} onValueChange={(value) => handleSelectChange('unit', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map(unit => (
                                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Price (₹)</Label>
                            <Input
                                id="price"
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                step="0.01"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note">Note (Optional)</Label>
                            <Textarea
                                id="note"
                                name="note"
                                value={formData.note}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded shadow-md hover:shadow-lg hover:bg-green-700 transition-all active:scale-[0.98] disabled:opacity-70 disabled:shadow-none uppercase tracking-wider font-medium text-sm mt-8"
                        >
                            {loading ? 'Saving...' : <><Check size={18} /> Complete Purchase</>}
                        </button>
                    </form>
                </div>
            </main>
        </div >
    );
};

export default ManualEntry;
