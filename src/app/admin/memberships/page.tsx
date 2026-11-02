"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  onAuthStateChanged,
  signOut,
  User
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Search,
  Users,
  CreditCard,
  CalendarDays,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  Trash2,
  LogOut
} from "lucide-react";

import { auth, db } from "@/lib/firebase";

type Student = {
  uid: string;
  fullName?: string;
  email?: string;
  nationalId?: string;
  courseToStudy?: string;
};

type MembershipPlan = {
  id: string;
  name: string;
  pathway: string;
  durationDays: number;
  price: number;
  description?: string;
  isActive: boolean;
};

type Membership = {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  planId: string;
  planName: string;
  pathway: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt?: unknown;
};

const pathways = [
  "MBBS Year 1",
  "MBBS Year 2",
  "MBBS Year 3",
  "MBBS Year 4",
  "MBBS Year 5",
  "MBBS Year 6",
  "MD Year 1",
  "MD Year 2",
  "MD Year 3",
  "MD Year 4",
  "MD Year 5",
  "MD Year 6",
  "NRE",
  "USMLE",
  "PLAB",
  "SMLE",
  "DHA",
  "AMC",
  "FCPS"
];

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T12:00:00`);
  result.setDate(result.getDate() + days);
  return result.toISOString().split("T")[0];
}

function getMembershipStatus(membership: Membership) {
  if (
    membership.status === "active" &&
    membership.endDate < todayString()
  ) {
    return "expired";
  }

  return membership.status;
}

export default function AdminMembershipsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const [planName, setPlanName] = useState("");
  const [planPathway, setPlanPathway] = useState("NRE");
  const [planDuration, setPlanDuration] = useState("30");
  const [planPrice, setPlanPrice] = useState("0");
  const [planDescription, setPlanDescription] = useState("");

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [membershipStart, setMembershipStart] = useState(todayString());

  const [saving, setSaving] = useState(false);

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

        if (
          !profileSnap.exists() ||
          profileSnap.data().role !== "admin"
        ) {
          window.location.href = "/dashboard";
          return;
        }

        setUser(currentUser);
        await loadData();
      } catch (err) {
        console.error(err);
        setError("Unable to load membership information.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loadData() {
    setRefreshing(true);
    setError("");

    try {
      const [studentSnap, planSnap, membershipSnap] =
        await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "membershipPlans")),
          getDocs(collection(db, "memberships"))
        ]);

      const studentList = studentSnap.docs.map((item) => ({
        uid: item.id,
        ...item.data()
      })) as Student[];

      const planList = planSnap.docs.map((item) => ({
        id: item.id,
        ...item.data()
      })) as MembershipPlan[];

      const membershipList = membershipSnap.docs.map((item) => ({
        id: item.id,
        ...item.data()
      })) as Membership[];

      setStudents(studentList);
      setPlans(planList);
      setMemberships(membershipList);
    } catch (err) {
      console.error(err);
      setError(
        "Could not load data. Please check your Firestore rules."
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function createPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!planName.trim() || !planPathway || !planDuration) {
      setError("Please complete the required plan fields.");
      return;
    }

    const duration = Number(planDuration);
    const price = Number(planPrice);

    if (
      !Number.isFinite(duration) ||
      duration < 1 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError("Enter a valid duration and price.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await addDoc(collection(db, "membershipPlans"), {
        name: planName.trim(),
        pathway: planPathway,
        durationDays: duration,
        price,
        description: planDescription.trim(),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setPlanName("");
      setPlanPathway("NRE");
      setPlanDuration("30");
      setPlanPrice("0");
      setPlanDescription("");
      setShowPlanForm(false);

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to create the membership plan.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePlan(plan: MembershipPlan) {
    try {
      await updateDoc(doc(db, "membershipPlans", plan.id), {
        isActive: !plan.isActive,
        updatedAt: serverTimestamp()
      });

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to update this plan.");
    }
  }

  async function removePlan(plan: MembershipPlan) {
    const inUse = memberships.some(
      (membership) => membership.planId === plan.id
    );

    if (inUse) {
      setError(
        "This plan is already assigned. Deactivate it instead of deleting it."
      );
      return;
    }

    if (!window.confirm(`Delete the plan "${plan.name}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "membershipPlans", plan.id));
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to delete this plan.");
    }
  }

  async function assignMembership(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const student = students.find(
      (item) => item.uid === selectedStudent
    );

    const plan = plans.find(
      (item) => item.id === selectedPlan
    );

    if (!student || !plan) {
      setError("Please select a student and an active plan.");
      return;
    }

    if (!plan.isActive) {
      setError("This plan is inactive. Choose another plan.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const endDate = addDays(
        membershipStart,
        plan.durationDays
      );

      await addDoc(collection(db, "memberships"), {
        studentId: student.uid,
        studentName: student.fullName || "Student",
        studentEmail: student.email || "",
        planId: plan.id,
        planName: plan.name,
        pathway: plan.pathway,
        startDate: membershipStart,
        endDate,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSelectedStudent("");
      setSelectedPlan("");
      setMembershipStart(todayString());
      setShowAssignForm(false);

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to assign this membership.");
    } finally {
      setSaving(false);
    }
  }

  async function changeMembershipStatus(
    membership: Membership,
    newStatus: string
  ) {
    try {
      await updateDoc(doc(db, "memberships", membership.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to update membership status.");
    }
  }

  const filteredMemberships = memberships.filter((membership) => {
    const status = getMembershipStatus(membership);
    const searchText = search.toLowerCase();

    const matchesSearch =
      (membership.studentName || "").toLowerCase().includes(searchText) ||
      (membership.studentEmail || "").toLowerCase().includes(searchText) ||
      (membership.planName || "").toLowerCase().includes(searchText) ||
      (membership.pathway || "").toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = memberships.filter(
    (item) => getMembershipStatus(item) === "active"
  ).length;

  const expiredCount = memberships.filter(
    (item) => getMembershipStatus(item) === "expired"
  ).length;

  const suspendedCount = memberships.filter(
    (item) => getMembershipStatus(item) === "suspended"
  ).length;

  const pendingCount = memberships.filter(
    (item) => getMembershipStatus(item) === "pending"
  ).length;

    if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
          <p className="text-sm text-slate-300">
            Loading membership management...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
              aria-label="Back to admin dashboard"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <h1 className="text-lg font-bold sm:text-xl">
                Membership Management
              </h1>
              <p className="text-xs text-slate-400">
                Rose Coaching Academy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>

            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-700"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6">
        {error && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <p>{error}</p>
            <button
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Membership Overview</h2>
              <p className="mt-1 text-sm text-slate-400">
                Monitor student subscriptions and access periods.
              </p>
            </div>

            <button
              onClick={() => setShowAssignForm(!showAssignForm)}
              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400"
            >
              <Plus size={17} />
              Assign Membership
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "Active",
                value: activeCount,
                icon: CheckCircle,
                color: "text-emerald-400"
              },
              {
                label: "Expired",
                value: expiredCount,
                icon: CalendarDays,
                color: "text-amber-400"
              },
              {
                label: "Suspended",
                value: suspendedCount,
                icon: PauseCircle,
                color: "text-red-400"
              },
              {
                label: "Pending",
                value: pendingCount,
                icon: CreditCard,
                color: "text-cyan-400"
              }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      {item.label}
                    </p>
                    <Icon size={20} className={item.color} />
                  </div>
                  <p className="mt-3 text-2xl font-bold">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {showAssignForm && (
          <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="mb-4 text-lg font-bold">
              Assign Membership to Student
            </h2>

            <form onSubmit={assignMembership} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Select Student
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(event) =>
                      setSelectedStudent(event.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm"
                  >
                    <option value="">Choose a student</option>
                    {students.map((student) => (
                      <option key={student.uid} value={student.uid}>
                        {student.fullName || student.email || student.uid}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Membership Plan
                  </label>
                  <select
                    value={selectedPlan}
                    onChange={(event) =>
                      setSelectedPlan(event.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm"
                  >
                    <option value="">Choose a plan</option>
                    {plans
                      .filter((plan) => plan.isActive)
                      .map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} — {plan.pathway} — {plan.durationDays} days
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={membershipStart}
                    onChange={(event) =>
                      setMembershipStart(event.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                >
                  {saving ? "Assigning..." : "Assign Membership"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAssignForm(false)}
                  className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Membership Plans</h2>
              <p className="text-sm text-slate-400">
                Create and manage the plans offered by RCA.
              </p>
            </div>

            <button
              onClick={() => setShowPlanForm(!showPlanForm)}
              className="flex items-center gap-2 rounded-lg border border-cyan-500/40 px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10"
            >
              <Plus size={16} />
              Create Plan
            </button>
          </div>

          {showPlanForm && (
            <form
              onSubmit={createPlan}
              className="mb-6 space-y-4 rounded-xl border border-slate-700 bg-slate-950 p-4"
            >
              <h3 className="font-semibold">New Membership Plan</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Plan Name
                  </label>
                  <input
                    value={planName}
                    onChange={(event) => setPlanName(event.target.value)}
                    required
                    placeholder="Example: NRE Complete Preparation"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Pathway
                  </label>
                  <select
                    value={planPathway}
                    onChange={(event) => setPlanPathway(event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
                  >
                    {pathways.map((pathway) => (
                      <option key={pathway} value={pathway}>
                        {pathway}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={planDuration}
                    onChange={(event) =>
                      setPlanDuration(event.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={planPrice}
                    onChange={(event) => setPlanPrice(event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Description
                </label>
                <textarea
                  value={planDescription}
                  onChange={(event) =>
                    setPlanDescription(event.target.value)
                  }
                  rows={3}
                  placeholder="Describe what this plan includes..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Plan"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPlanForm(false)}
                  className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {plans.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
              <CreditCard
                size={30}
                className="mx-auto mb-3 text-slate-500"
              />
              <p className="font-semibold">No plans created yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Create your first membership plan to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold">{plan.name}</h3>
                      <p className="mt-1 text-xs text-cyan-300">
                        {plan.pathway}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        plan.isActive
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {plan.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    {plan.description || "No description provided."}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                    <div>
                      <p className="text-lg font-bold">
                        {plan.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        {plan.durationDays} days
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePlan(plan)}
                        title={plan.isActive ? "Deactivate plan" : "Activate plan"}
                        className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800"
                      >
                        {plan.isActive ? (
                          <PauseCircle size={17} />
                        ) : (
                          <PlayCircle size={17} />
                        )}
                      </button>

                      <button
                        onClick={() => removePlan(plan)}
                        title="Delete plan"
                        className="rounded-lg border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Student Memberships</h2>
            <p className="text-sm text-slate-400">
              Search, review, suspend, reactivate, or revoke memberships.
            </p>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, email, plan or pathway..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-sm"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          {filteredMemberships.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
              <Users
                size={30}
                className="mx-auto mb-3 text-slate-500"
              />
              <p className="font-semibold">No memberships found</p>
              <p className="mt-1 text-sm text-slate-400">
                Assign a plan to a student to see it here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-xs uppercase text-slate-400">
                    <th className="px-3 py-3">Student</th>
                    <th className="px-3 py-3">Plan / Pathway</th>
                    <th className="px-3 py-3">Start</th>
                    <th className="px-3 py-3">Expiry</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMemberships.map((membership) => {
                    const status = getMembershipStatus(membership);

                    const statusStyle: Record<string, string> = {
                      active: "bg-emerald-500/10 text-emerald-300",
                      expired: "bg-amber-500/10 text-amber-300",
                      pending: "bg-cyan-500/10 text-cyan-300",
                      suspended: "bg-red-500/10 text-red-300",
                      revoked: "bg-slate-700 text-slate-300"
                    };

                    return (
                      <tr
                        key={membership.id}
                        className="border-b border-slate-800"
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold">
                            {membership.studentName || "Student"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {membership.studentEmail}
                          </p>
                                </td>

                        <td className="px-3 py-4">
                          <p>{membership.planName}</p>
                          <p className="text-xs text-slate-400">
                            {membership.pathway}
                          </p>
                        </td>

                        <td className="px-3 py-4">
                          {membership.startDate}
                        </td>

                        <td className="px-3 py-4">
                          {membership.endDate}
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              statusStyle[status] ||
                              "bg-slate-700 text-slate-300"
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            {status === "active" && (
                              <button
                                onClick={() =>
                                  changeMembershipStatus(
                                    membership,
                                    "suspended"
                                  )
                                }
                                title="Suspend membership"
                                className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800"
                              >
                                <PauseCircle size={16} />
                              </button>
                            )}

                            {status === "suspended" && (
                              <button
                                onClick={() =>
                                  changeMembershipStatus(
                                    membership,
                                    "active"
                                  )
                                }
                                title="Reactivate membership"
                                className="rounded-lg border border-emerald-500/30 p-2 text-emerald-300 hover:bg-emerald-500/10"
                              >
                                <PlayCircle size={16} />
                              </button>
                            )}

                            {status !== "revoked" &&
                              status !== "expired" && (
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "Are you sure you want to revoke this membership?"
                                      )
                                    ) {
                                      changeMembershipStatus(
                                        membership,
                                        "revoked"
                                      );
                                    }
                                  }}
                                  title="Revoke membership"
                                  className="rounded-lg border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10"
                                >
                                  <XCircle size={16} />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="pb-5 text-center text-xs text-slate-500">
          Rose Coaching Academy · Membership Administration
        </footer>
      </div>
    </main>
  );
                        }
