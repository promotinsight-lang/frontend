import Navbar from '../components/Navbar';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-4xl font-black text-gray-900 mb-8">Terms of Use</h1>
          
          <div className="space-y-6 text-gray-600 leading-relaxed">
            <p>Welcome to PromotInsight. By accessing and using our platform, you agree to comply with and be bound by the following Terms of Use. Please read them carefully.</p>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">1. Platform Overview</h2>
              <p>PromotInsight acts as a bridge between buyers and sellers to facilitate product engagement, verified campaign tasks, and e-commerce growth. We ensure a secure escrow system for transaction safety.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">2. Buyer Obligations</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must provide accurate profile links from respective e-commerce platforms (Amazon, Walmart, etc.) for verification.</li>
                <li>Purchases must be made using your own verified accounts.</li>
                <li>Campaign completion is confirmed only after successful verification of the order ID and completed engagement task.</li>
                <li>Creating multiple accounts to exploit the system is strictly prohibited and will result in a permanent ban.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">3. Seller Obligations</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Sellers must deposit funds upfront into the system wallet before listing a product.</li>
                <li>You are responsible for providing clear, accurate product keywords and engagement instructions.</li>
                <li>Disputes against buyers must be raised fairly and are subject to final manual verification by PromotInsight's admin mediation team.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-3">4. Escrow and Payments</h2>
              <p>All funds involved in an active task are locked securely in our escrow system. Escrow funds are only released to the buyer once the task is approved, or returned to the seller if a dispute is resolved in their favor.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
