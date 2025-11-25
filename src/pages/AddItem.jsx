import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../features/auth/authSlice';
import { addItem, subscribeToTypes, subscribeToUnits } from '../services/firestoreService';
import { ArrowLeft, Plus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

const AddItem = () => {
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const [loading, setLoading] = useState(false);
    const [itemTypes, setItemTypes] = useState(['Grocery']);
    const [units, setUnits] = useState(['Piece']);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Grocery',
        quantity: 1,
        unit: 'Piece',
        dueDate: new Date().toISOString().split('T')[0],
        note: '',
    });

    // Fetch types and units from Firestore
    useEffect(() => {
        const unsubscribeTypes = subscribeToTypes((types) => {
            setItemTypes(types);
            if (types.length > 0 && !types.includes(formData.type)) {
                setFormData(prev => ({ ...prev, type: types[0] }));
            }
        });

        const unsubscribeUnits = subscribeToUnits((fetchedUnits) => {
            setUnits(fetchedUnits);
            if (fetchedUnits.length > 0 && !fetchedUnits.includes(formData.unit)) {
                setFormData(prev => ({ ...prev, unit: fetchedUnits[0] }));
            }
        });

        return () => {
            unsubscribeTypes();
            unsubscribeUnits();
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return;

        setLoading(true);
        try {
            await addItem({
                ...formData,
                quantity: Number(formData.quantity),
                dueDate: new Date(formData.dueDate)
            }, user.uid);
            navigate('/');
        } catch (error) {
            console.error("Error adding item", error);
            alert("Failed to add item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
            <header className="bg-white dark:bg-gray-800 p-4 shadow-md sticky top-0 z-10 flex items-center gap-4 text-gray-800 dark:text-gray-200">
                <button onClick={() => navigate(-1)} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition">
                    <ArrowLeft />
                </button>
                <h1 className="text-xl font-medium">Add New Item</h1>
            </header>

            <main className="p-6 max-w-lg mx-auto">
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
                            date={formData.dueDate ? new Date(formData.dueDate) : undefined}
                            setDate={(date) => setFormData(prev => ({ ...prev, dueDate: date ? format(date, 'yyyy-MM-dd') : '' }))}
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
                        className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded shadow-md hover:shadow-lg hover:bg-primary-700 transition-all active:scale-[0.98] disabled:opacity-70 disabled:shadow-none uppercase tracking-wider font-medium text-sm mt-8"
                    >
                        {loading ? 'Adding...' : <><Plus size={18} /> Add Item</>}
                    </button>
                </form>
            </main>
        </div>
    );
};

export default AddItem;
