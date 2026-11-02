"use client";

import { useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  User
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs
} from "firebase/firestore";
import {
  Search,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Eye,
  ShieldCheck,
  UserCircle,
  ChevronRight
} from "lucide-react";
import { auth, db } from "@/lib/firebase";

type Student = {
  uid: string;
  fullName?: string;
  fatherName?: string;
  email?: string;
  nationalId?: string;
  whatsapp?: string;
  countryResidency?: string;
  countryStudy?: string;
  medicalProgram?: string;
  medicalYear?: string;
  graduationYear?: string | null;
  courseToStudy?: string;
  accountStatus?: string;
};

type AdminProfile = {
  fullName?: string;
  role?: string;
};

type NavigationItem = {
  label: string;
  icon: React.ElementType;
  route?: string;
};

const navigation: NavigationItem[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Manage Students", icon: Users },
  { label: "Memberships", icon: CreditCard, route: "/admin/memberships" },
  { label: "Courses", icon: BookOpen, route: "/admin/courses" },
  { label: "Exams", icon: ClipboardList, route: "/admin/exams" },
  { label: "Demo Content", icon: GraduationCap, route: "/admin/demo" },
  { label: "Finances & Invoices", icon: FileText, route: "/admin/finances" }
];

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("Overview");
  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.replace("/login");
        return;
      }

      try {
        await currentUser.reload();

        if (!currentUser.emailVerified) {
          await signOut(auth);
          window.location.replace("/login");
          return;
        }

        const profileSnapshot = await getDoc(
          doc(db, "users", currentUser.uid)
        );

        if (!profileSnapshot.exists()) {
          await signOut(auth);
          window.location.replace("/login");
          return;
        }

        const profile = profileSnapshot.data() as AdminProfile;

        if (profile.role !== "admin") {
          window.location.replace("/dashboard");
          return;
        }

        setUser(currentUser);
        setAdmin(profile);
        await loadStudents();
      } catch (err) {
        console.error("Admin authentication error:", err);
        setError(
          "Unable to verify admin access or load student records. Check your Firestore security rules."
        );
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loadStudents() {
    setRefreshing(true);
    setError("");

    try {
      const snapshot = await getDocs(collection(db, "users"));

      const records = snapshot.docs.map((studentDoc) => ({
        ...studentDoc.data(),
        uid: studentDoc.id
      })) as Student[];

      setStudents(records);
    } catch (err) {
      console.error("Student loading error:", err);
      setError(
        "Student records could not be loaded. Check that your admin UID is authorized in Firestore rules."
      );
    } finally {
      setRefreshing(false);
    }
  }

  function navigateTo(item: NavigationItem) {
    setMobileMenuOpen(false);
    setSelectedStudent(null);

    if (item.route) {
      window.location.href = item.route;
      return;
    }

    setActiveSection(item.label);
  }

  async function handleLogout() {
    await signOut(auth);
    window.location.replace("/login");
  }

  const filteredStudents = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return students;

    return students.filter((student) =>
      [
        student.fullName,
        student.email,
        student.nationalId,
        student.courseToStudy,
        student.whatsapp
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    );
  }, [students, search]);

  const pendingStudents = students.filter(
    (student) => student.accountStatus === "pending_verification"
  ).length;

  const activeStudents = students.filter(
    (student) => student.accountStatus === "active"
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-red-700 border-t-transparent" />
          <p className="font-semibold text-slate-700">
            Loading RCA Admin Portal...
          </p>
        </div>
      </main>
    );
  }

  if (!user || !admin) return null;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm lg:hidden">
        <div className="flex items-center gap-2">
          <img
            src="/rcalogo.png"
            alt="RCA"
            className="h-10 w-10 object-contain"
          />
          <div>
            <p className="font-bold text-red-700">RCA Admin</p>
            <p className="text-xs text-gray-500">
              Administration Portal
            </p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg border p-2"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <div className="flex min-h-screen">
        <aside
          className={`${
            mobileMenuOpen ? "block" : "hidden"
          } fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto bg-[#101d36] text-white lg:sticky lg:top-0 lg:block lg:h-screen`}
        >
          <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
            <img
              src="/rcalogo.png"
              alt="RCA Logo"
              className="h-12 w-12 rounded-lg bg-white object-contain p-1"
            />
            <div>
              <h1 className="font-bold">Rose Coaching</h1>
              <p className="text-sm text-slate-300">
                Academy Admin
              </p>
            </div>
          </div>

          <div className="px-4 py-6">
            <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Main Menu
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active =
                  activeSection === item.label &&
                  !item.route;

                return (
                  <button
                    key={item.label}
                    onClick={() => navigateTo(item)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-red-700 text-white"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={19} />
                      {item.label}
                    </span>
                    {item.route && <ChevronRight size={16} />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/10 p-4 lg:absolute lg:bottom-0 lg:w-full">
            <div className="mb-4 flex items-center gap-3">
              <UserCircle size={35} className="text-slate-300" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {admin.fullName || "RCA Administrator"}
                </p>
                <p className="text-xs text-slate-400">
                  Administrator
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-sm font-bold hover:bg-red-700"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {mobileMenuOpen && (
          <button
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          />
        )}

        <section className="min-w-0 flex-1">
          <header className="hidden items-center justify-between border-b bg-white px-8 py-5 lg:flex">
            <div>
              <h2 className="text-xl font-bold">
                {activeSection}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Rose Coaching Academy Management
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck className="text-green-700" size={21} />
              <span className="text-sm font-semibold">
                Admin Account
              </span>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-7">
              <p className="text-sm font-semibold text-red-700">
                ROSE COACHING ACADEMY
              </p>
              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                Welcome, {admin.fullName || "Admin"}!
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Manage your academy, students and learning programs.
              </p>
            </div>
                        {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-bold">Attention required</p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            {activeSection === "Overview" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Total Students"
                    value={students.length}
                    icon={<Users />}
                    color="blue"
                  />
                  <StatCard
                    title="Active Accounts"
                    value={activeStudents}
                    icon={<ShieldCheck />}
                    color="green"
                  />
                  <StatCard
                    title="Pending Verification"
                    value={pendingStudents}
                    icon={<RefreshCw />}
                    color="amber"
                  />
                  <StatCard
                    title="Learning Programs"
                    value="—"
                    icon={<BookOpen />}
                    color="purple"
                  />
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-3">
                  <div className="rounded-2xl border bg-white p-6 shadow-sm xl:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">
                          Recent Students
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Recently registered student accounts
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setActiveSection("Manage Students")
                        }
                        className="text-sm font-bold text-red-700"
                      >
                        View all
                      </button>
                    </div>

                    <div className="mt-5 space-y-3">
                      {students.slice(0, 5).map((student) => (
                        <button
                          key={student.uid}
                          onClick={() => {
                            setSelectedStudent(student);
                            setActiveSection("Manage Students");
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 text-left hover:bg-slate-100"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-bold">
                              {student.fullName || "Unnamed Student"}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {student.email}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-red-700">
                            View
                          </span>
                        </button>
                      ))}

                      {students.length === 0 && (
                        <p className="py-8 text-center text-sm text-gray-500">
                          No student records found.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-bold">
                      Quick Actions
                    </h3>

                    <div className="mt-5 space-y-3">
                      {navigation
                        .filter((item) => item.label !== "Overview")
                        .map((item) => {
                          const Icon = item.icon;

                          return (
                            <button
                              key={item.label}
                              onClick={() => navigateTo(item)}
                              className="flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm font-semibold hover:border-red-300 hover:bg-red-50"
                            >
                              <span className="flex items-center gap-3">
                                <Icon
                                  size={18}
                                  className="text-red-700"
                                />
                                {item.label}
                              </span>
                              <ChevronRight
                                size={16}
                                className="text-slate-400"
                              />
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === "Manage Students" && (
              <div className="rounded-2xl border bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold">
                      Student Records
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Registered RCA student accounts
                    </p>
                  </div>

                  <button
                    onClick={loadStudents}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={16}
                      className={refreshing ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>

                <div className="border-b p-5">
                  <div className="relative">
                    <Search
                      size={19}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Search name, email, ID, WhatsApp or pathway..."
                      className="w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none focus:border-red-500"
                    />
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    Showing {filteredStudents.length} of{" "}
                    {students.length} students
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-5 py-4">Student</th>
                        <th className="px-5 py-4">National ID</th>
                        <th className="px-5 py-4">Pathway</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {filteredStudents.map((student) => (
                        <tr
                          key={student.uid}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold">
                              {student.fullName || "Unnamed"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {student.email}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            {student.nationalId || "—"}
                          </td>

                          <td className="px-5 py-4">
                            {student.courseToStudy || "—"}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={student.accountStatus}
                            />
                          </td>

                          <td className="px-5 py-4">
                            <button
                              onClick={() =>
                                setSelectedStudent(student)
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 font-bold text-red-700 hover:bg-red-100"
                            >
                              <Eye size={15} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredStudents.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-12 text-center text-gray-500"
                          >
                            No matching students found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h3 className="text-xl font-bold">
                  Student Profile
                </h3>
                <p className="text-xs text-gray-500">
                  Complete registration information
                </p>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg border p-2"
                aria-label="Close profile"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <ProfileField
                label="Full Name"
                value={selectedStudent.fullName}
              />
              <ProfileField
                label="Father Name"
                value={selectedStudent.fatherName}
              />
              <ProfileField
                label="Email"
                value={selectedStudent.email}
              />
              <ProfileField
                label="National ID / Passport"
                value={selectedStudent.nationalId}
              />
              <ProfileField
                label="WhatsApp"
                value={selectedStudent.whatsapp}
              />
              <ProfileField
                label="Country of Residency"
                value={selectedStudent.countryResidency}
              />
              <ProfileField
                label="Country of Study"
                value={selectedStudent.countryStudy}
              />
              <ProfileField
                label="Medical Program"
                value={selectedStudent.medicalProgram}
              />
              <ProfileField
                label="Medical Year"
                value={selectedStudent.medicalYear}
              />
              <ProfileField
                label="Graduation Year"
                value={selectedStudent.graduationYear}
              />
              <ProfileField
                label="Selected Pathway"
                value={selectedStudent.courseToStudy}
              />
              <ProfileField
                label="Account Status"
                value={selectedStudent.accountStatus}
              />

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Firebase User ID
                </p>
                <p className="mt-1 break-all text-sm font-medium">
                  {selectedStudent.uid}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t p-5">
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
  color
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "green" | "amber" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700"
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-500">
          {title}
        </p>
        <div className={`rounded-xl p-3 ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-extrabold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const active = status === "active";
  const pending = status === "pending_verification";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        active
          ? "bg-green-100 text-green-800"
          : pending
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function ProfileField({
  label,
  value
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "Not provided"}
      </p>
    </div>
  );
                            }
