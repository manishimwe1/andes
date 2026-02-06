"use client"

import Link from "next/link"

export default function Page() {
    return (
        <div className="w-full">
            <main className="font-montserrat text-gray-800 overflow-x-hidden bg-gray-50">
                <nav className="fixed top-0 left-0 right-0 flex justify-between items-center px-[5%] py-6 bg-white/95 backdrop-blur-lg z-50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <img
                            src="https://images.unsplash.com/photo-1589828876954-ec07463ac0e6?w=50&q=80"
                            alt="ANDES Logo"
                            className="w-12 h-12 object-contain"
                        />
                        <span className="font-playfair text-2xl font-bold text-gray-800">ANDES</span>
                    </div>

                    <ul className="hidden md:flex gap-10 list-none">
                        <li>
                            <Link
                                href="/"
                                className="text-gray-800 font-medium text-sm relative hover:text-cyan-500 transition-colors duration-300 after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyan-500 after:transition-all after:duration-300 hover:after:w-full"
                            >
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/about"
                                className="text-gray-800 font-medium text-sm relative hover:text-cyan-500 transition-colors duration-300 after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyan-500 after:transition-all after:duration-300 hover:after:w-full"
                            >
                                About Us
                            </Link>
                        </li>
                        <li>
                            <Link href="/anti-fraud" className="text-gray-800 font-semibold text-sm relative border-b-2 border-gray-800">
                                Anti-fraud
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/occupation"
                                className="text-gray-800 font-medium text-sm relative hover:text-cyan-500 transition-colors duration-300 after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyan-500 after:transition-all after:duration-300 hover:after:w-full"
                            >
                                Occupation
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/joining-process"
                                className="text-gray-800 font-medium text-sm relative hover:text-cyan-500 transition-colors duration-300 after:content-[''] after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-0.5 after:bg-cyan-500 after:transition-all after:duration-300 hover:after:w-full"
                            >
                                Joining process
                            </Link>
                        </li>
                    </ul>
                </nav>

                <section className="relative pt-24 pb-20 overflow-hidden">
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&q=80"
                            alt="ANDES Team"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" style={{ clipPath: 'ellipse(100% 100% at 50% 100%)' }} />

                    <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-32">
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">JOIN OUR JOURNEY</h1>
                        <p className="text-2xl md:text-3xl text-white">Collaborate and Innovate with ANDES</p>
                    </div>
                </section>

                <section className="py-16 px-[5%] bg-white">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative overflow-hidden rounded-2xl shadow-lg">
                                <img
                                    src="https://images.unsplash.com/photo-1589828876954-ec07463ac0e6?w=400&q=80"
                                    alt="Certificate"
                                    className="w-full h-64 object-cover"
                                />
                            </div>
                            <div className="relative overflow-hidden rounded-2xl shadow-lg mt-8">
                                <img
                                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80"
                                    alt="Business professional"
                                    className="w-full h-64 object-cover"
                                />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Empowering Global Collaboration</h2>
                            <p className="text-lg text-gray-600 leading-relaxed mb-4">
                                Join us in fostering a robust sharing economy that benefits communities worldwide. At ANDES, we are committed to transparency, integrity, and
                                innovation.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="py-16 px-[5%] bg-gray-50">
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8">Common Scams to Be Aware Of</h2>

                            <div className="space-y-8">
                                <div className="bg-white rounded-xl p-8 shadow-md">
                                    <h3 className="text-xl font-semibold text-cyan-600 mb-3">1. Impersonation of Influencer Popularity</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        Scammers use the popularity and influence of well-known individuals to promote fraudulent investment schemes, often asking for a
                                        non-refundable deposit.
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl p-8 shadow-md">
                                    <h3 className="text-xl font-semibold text-cyan-600 mb-3">2. Fake Investment Platforms</h3>
                                    <p className="text-gray-600 leading-relaxed">(Forex, Bitcoin, Cryptocurrency) → Scammers use social media or WhatsApp to lure victims with promises of high returns.</p>
                                </div>

                                <div className="bg-white rounded-xl p-8 shadow-md">
                                    <h3 className="text-xl font-semibold text-cyan-600 mb-3">3. Online Shopping Scams and Phishing Sites</h3>
                                    <p className="text-gray-600 leading-relaxed">They create fake websites to deceive consumers, charge for products that were never delivered or steal bank details.</p>
                                </div>

                                <div className="bg-white rounded-xl p-8 shadow-md">
                                    <h3 className="text-xl font-semibold text-cyan-600 mb-3">4. "Get Paid to Review a Movie" Scams</h3>
                                    <p className="text-gray-600 leading-relaxed">These scams claim to hire individuals to boost the ratings of a movie and require an upfront deposit.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-16">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">After analysis, we can identify the common features of all these scams:</h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-3">
                                    <span className="text-red-500 text-2xl mt-1">✕</span>
                                    <p className="text-gray-700">No real industry support; they promise extremely high returns and guaranteed compensation for losses.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-red-500 text-2xl mt-1">✕</span>
                                    <p className="text-gray-700">Lack of transparency in revenue sources.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-red-500 text-2xl mt-1">✕</span>
                                    <p className="text-gray-700">Heavy reliance on word-of-mouth promotion and exaggerated promises.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-red-500 text-2xl mt-1">✕</span>
                                    <p className="text-gray-700">Unregulated financial transactions.</p>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-6">In contrast, ANDES is completely different:</h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-green-500 text-2xl mt-1">✓</span>
                                    <p className="text-gray-700">Backed by real assets: shared bike infrastructure. We do not promise high returns.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-green-500 text-2xl mt-1">✓</span>
                                    <p className="text-gray-700">Revenue comes from the real rental market.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-green-500 text-2xl mt-1">✓</span>
                                    <p className="text-gray-700">Clear and well-defined development plan.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-green-500 text-2xl mt-1">✓</span>
                                    <p className="text-gray-700">All business operations are transparent, official and verifiable.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-8 mb-16 rounded-r-xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Special reminder:</h3>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Scammers often impersonate legitimate companies to deceive people. Criminals may use ANDES's growing brand awareness for illegal purposes.
                            </p>
                            <p className="text-gray-700 leading-relaxed">Fraudulent activities involving imitation, counterfeiting or misuse of the ANDES name are increasingly likely to occur.</p>
                        </div>

                        <div className="mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8">How to Join ANDES Safely</h2>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3 bg-white p-6 rounded-xl shadow-md">
                                    <span className="text-green-500 text-2xl mt-1">✓</span>
                                    <p className="text-gray-700">Only register through official recommendations or authorized channels.</p>
                                </div>
                                <div className="flex items-start gap-3 bg-white p-6 rounded-xl shadow-md">
                                    <span className="text-green-500 text-2xl mt-1">✓</span>
                                    <p className="text-gray-700">Reject any offers that promise abnormally high returns or unauthorized promotions.</p>
                                </div>
                                <div className="flex items-start gap-3 bg-white p-6 rounded-xl shadow-md">
                                    <span className="text-green-500 text-2xl mt-1">✓</span>
                                    <p className="text-gray-700">If you have any questions or concerns, contact official channels immediately.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-8 rounded-2xl mb-16">
                            <p className="text-gray-700 leading-relaxed mb-4">
                                <strong>ANDES Sharing Technology Co., Ltd.</strong> is registered in Hong Kong and the United Kingdom and is duly authorized as a Money Service
                                Business (MSB) by the US Financial Crimes Enforcement Network (FinCEN).
                            </p>
                            <p className="text-gray-700 leading-relaxed">The MSB Registration Search webpage is updated weekly and includes entities officially registered as MSBs.</p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-lg mb-16">
                            <ol className="space-y-3 text-gray-700 list-decimal list-inside">
                                <li className="text-cyan-600 font-medium">Remittance services</li>
                                <li className="text-cyan-600 font-medium">Currency exchange services</li>
                                <li className="text-cyan-600 font-medium">Check cashing</li>
                                <li className="text-cyan-600 font-medium">Issuance or sale of prepaid cards, traveler's checks, money orders, etc.</li>
                                <li className="text-cyan-600 font-medium">Cryptocurrency-related services</li>
                            </ol>
                            <p className="text-gray-600 mt-6 leading-relaxed">Investment services are provided by ANDES Shared Technology Co., Ltd., headquartered in Hong Kong and the UK.</p>
                        </div>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-8 rounded-r-xl mb-16">
                            <p className="text-gray-700 leading-relaxed mb-4">All official documents, licenses and registrations related to ANDES can be freely verified through official channels.</p>
                        </div>

                        <div className="mb-16">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Commitment:</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">Joining the ANDES bike-sharing program means that you have confidence in the potential and development prospects of the industry.</p>
                            <p className="text-gray-700 leading-relaxed">We are committed to positioning the ANDES brand as a market leader and creating jobs in the region.</p>
                        </div>

                        <div className="bg-gray-100 p-8 rounded-2xl">
                            <p className="text-gray-700 leading-relaxed mb-4 font-semibold">Thank you for taking the time to read this article.</p>
                            <p className="text-gray-600 leading-relaxed mb-4">Raising risk awareness may not make you rich immediately, but it can protect your assets and personal safety.</p>
                            <p className="text-gray-600 leading-relaxed">Risk prevention is a long-term investment that provides lasting peace of mind.</p>
                        </div>
                    </div>
                </section>

                <footer className="bg-gray-900 text-white py-12 px-[5%]">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <img src="https://images.unsplash.com/photo-1589828876954-ec07463ac0e6?w=50&q=80" alt="ANDES Logo" className="w-10 h-10 object-contain" />
                                <span className="font-playfair text-xl font-bold">ANDES</span>
                            </div>
                            <p className="text-gray-400 text-sm">Empowering a Global Sharing Economy for Tomorrow's Leaders</p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li>
                                    <Link href="/">Home</Link>
                                </li>
                                <li>
                                    <Link href="/about">About Us</Link>
                                </li>
                                <li>
                                    <Link href="/anti-fraud">Anti-fraud</Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-lg mb-4">Support</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li>
                                    <a href="#faq" className="hover:text-cyan-500 transition-colors">FAQ</a>
                                </li>
                                <li>
                                    <a href="#contact" className="hover:text-cyan-500 transition-colors">Contact</a>
                                </li>
                                <li>
                                    <a href="#privacy" className="hover:text-cyan-500 transition-colors">Privacy Policy</a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-lg mb-4">Connect</h4>
                            <p className="text-gray-400 text-sm mb-4">Follow us on social media</p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center hover:bg-cyan-600 transition-colors">
                                    <span className="text-white font-bold">f</span>
                                </a>
                                <a href="#" className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center hover:bg-cyan-600 transition-colors">
                                    <span className="text-white font-bold">t</span>
                                </a>
                                <a href="#" className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center hover:bg-cyan-600 transition-colors">
                                    <span className="text-white font-bold">in</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
                        <p>© 2026 ANDES. All rights reserved.</p>
                    </div>
                </footer>
            </main>
        </div>
    )
}