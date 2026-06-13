import Link from "next/link";

const CARDS = [
  { href: "/admin/products", title: "Products", desc: "Manage the menu, prices, tax" },
  { href: "/admin/categories", title: "Categories", desc: "Group products, set colors" },
  { href: "/admin/booking", title: "Floors & Tables", desc: "Floor plan & seating" },
  { href: "/admin/payment-methods", title: "Payment Methods", desc: "Enable Cash / Card / UPI" },
  { href: "/admin/coupons", title: "Coupons & Promos", desc: "Discounts & offers" },
  { href: "/admin/users", title: "Users", desc: "Staff & roles" },
  { href: "/admin/reports", title: "Reports", desc: "Sales & insights" },
];

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
      <p className="mt-1 text-gray-500">Configure the cafe. Changes reflect in the POS terminal.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <p className="font-semibold text-gray-900">{c.title}</p>
            <p className="mt-1 text-sm text-gray-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
