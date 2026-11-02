
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  onAuthStateChanged,
  signOut,
  User
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";
import {
  ArrowLeft,
  Plus,
  Search,
  Receipt,
  Wallet,
  TrendingUp,
  Clock,
  Printer,
  X,
  Trash2,
  FileText,
  LogOut,
  Loader2,
  RefreshCw
} from "lucide-react";

import { auth, db } from "@/lib/firebase";

type Student = {
  id: string;
  uid?: string;
  fullName?: string;
  email?: string;
  nationalId?: string;
  courseToStudy?: string;
  whatsapp?: string;
};

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  nationalId: string;
  email: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: "Paid" | "Partially Paid" | "Unpaid";
  notes: string;
  createdAt?: unknown;
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0
  }).format(amount || 0);

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

type SummaryCardProps = {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
};

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

export default function AdminFinancesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminName, setAdminName] = useState("Admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<Invoice | null>(null);

  const [studentId, setStudentId] = useState("");
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState("");
  const [discount, setDiscount] = useState("0");
  const [amountPaid, setAmountPaid] = useState("0");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: "",
      quantity: 1,
      unitPrice: 0
    }
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      try {
        await currentUser.reload();

        if (!currentUser.emailVerified) {
          await signOut(auth);
          window.location.href = "/login";
          return;
        }

        const profileRef = doc(db, "users", currentUser.uid);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists() ||
            profileSnap.data().role !== "admin") {
          window.location.href = "/dashboard";
          return;
        }

        setUser(currentUser);
        setAdminName(
          profileSnap.data().fullName || "Admin"
        );

        await loadData();
      } catch (err) {
        console.error(err);
        setError("Unable to load the finance dashboard.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loadData() {
    const [studentSnap, invoiceSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(
        query(
          collection(db, "invoices"),
          orderBy("createdAt", "desc")
        )
      )
    ]);

    const studentList = studentSnap.docs
      .filter((item) => item.data().role !== "admin")
      .map((item) => ({
        id: item.id,
        ...item.data()
      })) as Student[];

    const invoiceList = invoiceSnap.docs.map((item) => ({
      id: item.id,
      ...item.data()
    })) as Invoice[];

    setStudents(studentList);
    setInvoices(invoiceList);
  }

  const totals = useMemo(() => {
    const invoiced = invoices.reduce(
      (sum, invoice) => sum + (Number(invoice.total) || 0),
      0
    );

    const received = invoices.reduce(
      (sum, invoice) => sum + (Number(invoice.amountPaid) || 0),
      0
    );

    const outstanding = invoices.reduce(
      (sum, invoice) => sum + (Number(invoice.balance) || 0),
      0
    );

    return {
      invoiced,
      received,
      outstanding,
      count: invoices.length
    };
  }, [invoices]);

  const filteredInvoices = invoices.filter((invoice) => {
    const term = search.toLowerCase();

    return (
      invoice.invoiceNumber?.toLowerCase().includes(term) ||
      invoice.studentName?.toLowerCase().includes(term) ||
      invoice.nationalId?.toLowerCase().includes(term) ||
      invoice.email?.toLowerCase().includes(term)
    );
  });

  const selectedStudent = students.find(
    (student) => student.id === studentId
  );

  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      Math.max(0, Number(item.quantity) || 0) *
      Math.max(0, Number(item.unitPrice) || 0),
    0
  );

  const safeDiscount = Math.max(
    0,
    Math.min(Number(discount) || 0, subtotal)
  );

  const invoiceTotal = Math.max(0, subtotal - safeDiscount);

  function resetForm() {
    setStudentId("");
    setIssueDate(today());
    setDueDate("");
    setDiscount("0");
    setAmountPaid("0");
    setNotes("");
    setItems([
      {
        description: "",
        quantity: 1,
        unitPrice: 0
      }
    ]);
    setShowForm(false);
  }

  function updateItem(
    index: number,
    field: keyof InvoiceItem,
    value: string
  ) {
    setItems((current) =>
      current.map((item, i) => {
        if (i !== index) return item;

        if (field === "description") {
          return { ...item, description: value };
        }

        return {
          ...item,
          [field]: Math.max(0, Number(value) || 0)
        };
      })
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        description: "",
        quantity: 1,
        unitPrice: 0
      }
    ]);
  }

  function removeItem(index: number) {
    setItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, i) => i !== index)
    );
  }

  async function createInvoice(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedStudent) {
      setError("Please select a student.");
      return;
    }

    if (items.some((item) =>
      !item.description.trim() ||
      item.quantity <= 0 ||
      item.unitPrice < 0
    )) {
      setError("Please complete every invoice item.");
      return;
    }

    const paid = Number(amountPaid);

    if (!Number.isFinite(paid) || paid < 0 || paid > invoiceTotal) {
      setError("Payment must be between zero and the invoice total.");
      return;
    }

    if (!issueDate) {
      setError("Please select an invoice issue date.");
      return;
    }

    if (dueDate && dueDate < issueDate) {
      setError("Due date cannot be earlier than issue date.");
      return;
    }

    setSaving(true);

    try {
      const invoiceRef = doc(collection(db, "invoices"));
      const balance = invoiceTotal - paid;

      const invoiceNumber =
        `RCA-${invoiceRef.id.slice(0, 8).toUpperCase()}`;

      const invoice: Omit<Invoice, "id"> = {
        invoiceNumber,
        studentId: selectedStudent.id,
        studentName: selectedStudent.fullName || "Student",
        nationalId: selectedStudent.nationalId || "",
        email: selectedStudent.email || "",
        issueDate,
        dueDate,
        items: items.map((item) => ({
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        })),
        subtotal,
        discount: safeDiscount,
        total: invoiceTotal,
        amountPaid: paid,
        balance,
        status:
          balance === 0
            ? "Paid"
            : paid > 0
              ? "Partially Paid"
              : "Unpaid",
        notes: notes.trim(),
        createdAt: serverTimestamp()
      };

      await setDoc(invoiceRef, {
  ...invoice,
  invoiceNumber,
  id: invoiceRef.id
});

      setSuccess(`Invoice ${invoiceNumber} created successfully.`);
      await loadData();
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Could not create invoice. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function printInvoice(invoice: Invoice) {
    setSelectedInvoice(invoice);

    setTimeout(() => {
      window.print();
    }, 300);
  }

  async function logout() {
    await signOut(auth);
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-700" size={32} />
      </div>
    );
  }

  if (!user) return null;
      return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              <ArrowLeft size={16} />
              Back to Admin Dashboard
            </Link>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Finances & Invoices
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Welcome, {adminName}. Manage academy payments and invoices.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                setError("");
                setSuccess("");
                try {
                  await loadData();
                  setSuccess("Finance records refreshed.");
                } catch {
                  setError("Unable to refresh finance records.");
                }
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              <Plus size={17} />
              Create Invoice
            </button>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Invoiced"
            value={money(totals.invoiced)}
            icon={Receipt}
            color="bg-blue-50 text-blue-700"
          />

          <SummaryCard
            title="Amount Received"
            value={money(totals.received)}
            icon={Wallet}
            color="bg-green-50 text-green-700"
          />

          <SummaryCard
            title="Outstanding Balance"
            value={money(totals.outstanding)}
            icon={Clock}
            color="bg-amber-50 text-amber-700"
          />

          <SummaryCard
            title="Total Invoices"
            value={String(totals.count)}
            icon={TrendingUp}
            color="bg-purple-50 text-purple-700"
          />
        </section>

        {showForm && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create New Invoice
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select a student and add invoice items.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createInvoice} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Select Student *
                  </label>

                  <select
                    value={studentId}
                    onChange={(event) => setStudentId(event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm"
                  >
                    <option value="">Choose a student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.fullName || "Unnamed Student"} —{" "}
                        {student.email || student.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    National ID / Passport
                  </label>

                  <input
                    value={selectedStudent?.nationalId || ""}
                    readOnly
                    placeholder="Student ID will appear here"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Issue Date *
                  </label>

                  <input
                    type="date"
                    value={issueDate}
                    onChange={(event) => setIssueDate(event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Due Date
                  </label>

                  <input
                    type="date"
                    value={dueDate}
                    min={issueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold text-slate-900">
                    Invoice Items
                  </h3>

                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-12"
                    >
                      <div className="sm:col-span-5">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">
                          Description
                        </label>
                        <input
                          value={item.description}
                          onChange={(event) =>
                            updateItem(index, "description", event.target.value)
                          }
                          placeholder="e.g. USMLE preparation course"
                          required
                          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(index, "quantity", event.target.value)
                          }
                          required
                          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">
                          Unit Price (PKR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateItem(index, "unitPrice", event.target.value)
                          }
                          required
                          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                        />
                      </div>

                      <div className="flex items-end justify-between gap-2 sm:col-span-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            Line Total
                          </label>
                          <p className="py-2.5 text-sm font-bold text-slate-900">
                            {money(item.quantity * item.unitPrice)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="mb-1 rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-30"
                          title="Remove item"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Discount (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    step="1"
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Amount Paid (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={invoiceTotal}
                    step="1"
                    value={amountPaid}
                    onChange={(event) => setAmountPaid(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                  />
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-slate-600">
                    <span>Discount</span>
                    <span>{money(safeDiscount)}</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-900">
                    <span>Total</span>
                    <span>{money(invoiceTotal)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm font-semibold text-green-700">
                    <span>Balance</span>
                    <span>
                      {money(invoiceTotal - (Number(amountPaid) || 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Payment instructions or additional information..."
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Receipt size={17} />
                  )}
                  {saving ? "Saving..." : "Save Invoice"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 print:hidden">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Invoice History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View and print invoices issued by Rose Coaching Academy.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search
                size={17}
                className="absolute left-3 top-3 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoice, student or ID..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="px-3 py-3">Invoice</th>
                  <th className="px-3 py-3">Student</th>
                  <th className="px-3 py-3">Issue Date</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Paid</th>
                  <th className="px-3 py-3">Balance</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-4 font-semibold text-blue-700">
                      {invoice.invoiceNumber}
                    </td>

                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-800">
                        {invoice.studentName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {invoice.email}
                      </p>
                    </td>

                    <td className="px-3 py-4 text-slate-600">
                      {invoice.issueDate}
                    </td>

                    <td className="px-3 py-4 font-semibold">
                      {money(invoice.total)}
                    </td>

                    <td className="px-3 py-4 text-green-700">
                      {money(invoice.amountPaid)}
                    </td>

                    <td className="px-3 py-4 text-amber-700">
                      {money(invoice.balance)}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          invoice.status === "Paid"
                            ? "bg-green-50 text-green-700"
                            : invoice.status === "Partially Paid"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => printInvoice(invoice)}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Printer size={15} />
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredInvoices.length === 0 && (
              <div className="py-12 text-center">
                <FileText
                  size={32}
                  className="mx-auto mb-3 text-slate-300"
                />
                <p className="font-semibold text-slate-700">
                  No invoices found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Create your first invoice or change your search.
                </p>
              </div>
            )}
          </div>
        </section>

        {selectedInvoice && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-white">
            <div className="mx-auto max-w-4xl p-5 sm:p-10">
              <div className="mb-6 flex flex-wrap justify-between gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <X size={16} />
                  Close Invoice
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  <Printer size={16} />
                  Print / Save as PDF
                </button>
              </div>

              <div className="border border-slate-200 p-6 sm:p-10 print:border-0 print:p-0">
                <div className="flex flex-wrap items-center justify-between gap-5 border-b-2 border-blue-900 pb-6">
                  <div className="flex items-center gap-4">
                    <img
                      src="/rcalogo.png"
                      alt="Rose Coaching Academy logo"
                      className="h-20 w-20 object-contain"
                    />

                    <div>
                      <h1 className="text-2xl font-bold text-blue-950">
                        Rose Coaching Academy
                      </h1>
                      <p className="mt-1 text-sm text-slate-500">
                        Medical Education & Coaching
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <h2 className="text-3xl font-extrabold tracking-wider text-blue-900">
                      INVOICE
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {selectedInvoice.invoiceNumber}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 py-8 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Invoice To
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedInvoice.studentName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedInvoice.email}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      National ID / Passport:{" "}
                      {selectedInvoice.nationalId || "Not provided"}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-sm text-slate-600">
                      <strong>Issue Date:</strong>{" "}
                      {selectedInvoice.issueDate}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      <strong>Due Date:</strong>{" "}
                      {selectedInvoice.dueDate || "Not specified"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      <strong>Status:</strong>{" "}
                      {selectedInvoice.status}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[450px] text-left text-sm">
                    <thead>
                      <tr className="bg-blue-950 text-white">
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Unit Price</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedInvoice.items.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-slate-200"
                        >
                          <td className="px-4 py-4">
                            {item.description}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {money(item.unitPrice)}
                          </td>
                          <td className="px-4 py-4 text-right font-semibold">
                            {money(item.quantity * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="ml-auto mt-6 max-w-sm space-y-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{money(selectedInvoice.subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Discount</span>
                    <span>{money(selectedInvoice.discount)}</span>
                  </div>

                  <div className="flex justify-between border-t border-slate-300 pt-3 font-bold text-slate-900">
                    <span>Total</span>
                    <span>{money(selectedInvoice.total)}</span>
                  </div>

                  <div className="flex justify-between text-sm text-green-700">
                    <span>Amount Paid</span>
                    <span>{money(selectedInvoice.amountPaid)}</span>
                  </div>

                  <div className="flex justify-between border-t-2 border-blue-900 pt-3 text-lg font-extrabold text-blue-950">
                    <span>Balance Due</span>
                    <span>{money(selectedInvoice.balance)}</span>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="mt-8 rounded-lg bg-slate-50 p-4">
                    <p className="mb-1 text-sm font-bold text-slate-800">
                      Notes
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-slate-600">
                      {selectedInvoice.notes}
                    </p>
                  </div>
                )}

                <div className="mt-16 border-t border-slate-200 pt-6 text-center">
                  <p className="font-bold text-blue-950">
                    Thank you for choosing Rose Coaching Academy.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    This invoice was generated electronically by RCA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .fixed.inset-0.z-\\[100\\],
          .fixed.inset-0.z-\\[100\\] * {
            visibility: visible;
          }

          .fixed.inset-0.z-\\[100\\] {
            position: absolute !important;
            inset: 0 !important;
            overflow: visible !important;
            background: white !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>
    </main>
  );
                          }
