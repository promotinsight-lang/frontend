import {  useState  } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function VerificationFieldsGuide({ variant = 'global' }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-bold text-[#0066ff]"
      >
        <span className="flex items-center gap-2">
          <HelpCircle size={18} />
          Key, Label, Placeholder — কী লিখবেন? (গাইড)
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs text-gray-700 space-y-3 border-t border-blue-100 pt-3">
          <p>
            <strong>Key</strong> — সিস্টেমের ভিতরের নাম (ইংরেজি, ছোট হাতের, স্পেস ছাড়া underscore)।
            Buyer submit করলে এই key দিয়ে ডেটা সেভ হয়। একবার সেট করলে পরে না বদলানো ভালো।
          </p>
          <p>
            <strong>Label</strong> — Buyer যেটা দেখবে (ফর্মের উপরের লেখা)। যেকোনো ভাষায় লিখতে পারেন।
          </p>
          <p>
            <strong>Placeholder</strong> — input বক্সের ভিতরের হালকা উদাহরণ/নির্দেশনা।
          </p>
          <p>
            <strong>Type</strong> — text (সাধারণ), email (ইমেইল), url (লিংক), tel (ফোন/WhatsApp)।
          </p>
          <p>
            <strong>Required</strong> — চেক থাকলে Buyer ছাড়া submit করতে পারবে না।
          </p>

          {variant === 'global' ? (
            <div className="bg-white rounded-lg border p-3 space-y-2">
              <p className="font-bold text-gray-800">Global fields — সব country/platform-এ একই:</p>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left pb-1">Key</th>
                    <th className="text-left pb-1">Label</th>
                    <th className="text-left pb-1">Placeholder</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <tr>
                    <td className="py-1 pr-2">paypal_account</td>
                    <td>Email Address</td>
                    <td>yourname@email.com</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2">whatsapp_account</td>
                    <td>WhatsApp Number</td>
                    <td>+1 555 123 4567</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2">facebook_account</td>
                    <td>Facebook URL</td>
                    <td>https://www.facebook.com/your.profile</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-3 space-y-2">
              <p className="font-bold text-gray-800">
                Country + Platform fields — শুধু সেই দেশ/প্ল্যাটফর্ম বেছে নিলে (যেমন USA + Amazon):
              </p>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left pb-1">Key</th>
                    <th className="text-left pb-1">Label</th>
                    <th className="text-left pb-1">Placeholder</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <tr>
                    <td className="py-1 pr-2">account_name</td>
                    <td>Amazon Account Name</td>
                    <td>Your Amazon display name</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-2">profile_url</td>
                    <td>Amazon Profile URL</td>
                    <td>https://www.amazon.com/gp/profile/...</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-gray-500">
                Walmart-এর জন্য আলাদা row: key একই রাখতে পারেন, Label-এ “Walmart Account Name” লিখুন।
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
