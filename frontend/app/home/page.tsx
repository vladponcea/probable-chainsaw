'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientsApi } from '@/lib/api';

export default function LandingPage() {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        agreed: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.agreed) return;

        try {
            setLoading(true);
            const client = await clientsApi.create({
                companyName: formData.name, // Mapping Name to companyName as requested
                email: formData.email,
                phone: formData.phone,
            });

            // Redirect to onboarding
            router.push(`/onboarding/${client.onboardingToken}`);
        } catch (error) {
            console.error('Failed to create client:', error);
            alert('Failed to start. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects are handled by global.css, but we can add some local flair if needed */}

            <div className="max-w-md w-full z-10">
                {!showForm ? (
                    <div className="text-center space-y-8 animate-fade-in">
                        <h1 className="text-6xl font-bold tracking-tighter">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-blue-400 to-white">
                                Start Your Journey
                            </span>
                        </h1>

                        <p className="text-xl text-slate-400 leading-relaxed">
                            Transform your business with our comprehensive dashboard solution.
                            Track metrics, manage leads, and grow faster.
                        </p>

                        <button
                            onClick={() => setShowForm(true)}
                            className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold text-lg transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:-translate-y-1"
                        >
                            <span className="relative z-10">Start</span>
                            <div className="absolute inset-0 rounded-full bg-white/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                ) : (
                    <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-2xl animate-slide-up">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center">Get Started</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>

                            <div className="flex items-start space-x-3 pt-2">
                                <div className="flex items-center h-5">
                                    <input
                                        id="marketing"
                                        type="checkbox"
                                        required
                                        checked={formData.agreed}
                                        onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-950/50 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                    />
                                </div>
                                <label htmlFor="marketing" className="text-sm text-slate-400">
                                    I agree to be contacted for marketing purposes
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !formData.agreed}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    'Next'
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
