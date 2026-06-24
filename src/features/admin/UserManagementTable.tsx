"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, Edit2, Ban, ShieldAlert, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { ErrorState, EmptyState } from "../../components/shared/States";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../../app/components/ui/dropdown-menu";
import { getAllUsers, updateUserRole, toggleUserBan, deleteUserAccount } from "../../app/actions/admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Agent" | "User";
  status: "Active" | "Banned" | "Pending";
  joinedAt: string;
  avatarInitials: string;
}

export function UserManagementTable() {
  const [data, setData] = useState<User[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dbUsers = await getAllUsers();
      const mappedData = dbUsers.map(user => ({
        id: user.id,
        name: user.name || "Unknown User",
        email: user.email || "No email",
        role: user.role === "ADMIN" ? "Admin" : (user.role === "AGENT" ? "Agent" : "User") as any,
        status: user.isBanned ? "Banned" : (user.agentVerified ? "Active" : (user.role === "AGENT" ? "Pending" : "Active")) as any,
        joinedAt: new Date(user.emailVerified || Date.now()).toLocaleDateString(), // We don't have createdAt in User, so using fallback
        avatarInitials: (user.name?.[0] || "U").toUpperCase()
      }));
      setData(mappedData);
    } catch (err: any) {
      setError("Failed to fetch users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (id: string, newRole: "Admin" | "Agent" | "User") => {
    if (!data) return;
    try {
      const serverRole = newRole === "Admin" ? "ADMIN" : newRole === "Agent" ? "AGENT" : "CORP";
      await updateUserRole(id, serverRole);
      setData(data.map(user => user.id === id ? { ...user, role: newRole } : user));
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const handleToggleBan = async (id: string, currentStatus: "Active" | "Banned" | "Pending") => {
    if (!data) return;
    try {
      const newStatus = currentStatus === 'Banned' ? 'Active' : 'Banned';
      await toggleUserBan(id, newStatus === 'Banned');
      setData(data.map(user => user.id === id ? { ...user, status: newStatus } : user));
      if (newStatus === 'Banned') {
        toast.warning("User has been banned");
      } else {
        toast.success("User has been unbanned");
      }
    } catch (error) {
      toast.error("Failed to toggle ban status");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!data) return;
    try {
      await deleteUserAccount(id);
      setData(data.filter(user => user.id !== id));
      toast.error(`${name} has been deleted`);
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const filteredData = data?.filter((user) => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) return <ErrorState onRetry={fetchUsers} />;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 md:p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <Button variant="outline" className="w-full sm:w-auto rounded-xl bg-white">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Table / List */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold hidden md:table-cell">Joined</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                  <td className="px-6 py-4 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                </tr>
              ))
            ) : filteredData?.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8">
                  <EmptyState 
                    icon={Search} 
                    title="No users found" 
                    description={searchTerm ? `No users matching "${searchTerm}"` : "There are no users in the system yet."}
                  />
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {filteredData?.map((user, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: idx * 0.05 }}
                    key={user.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200">
                          {user.avatarInitials}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        user.role === 'Agent' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        user.status === 'Banned' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {user.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>}
                        {user.status === 'Banned' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>}
                        {user.status === 'Pending' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">
                      {user.joinedAt}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="w-8 h-8 p-0 rounded-lg text-slate-400 hover:text-slate-900 focus:ring-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-white border border-slate-200 shadow-lg rounded-xl p-1 z-50">
                          <DropdownMenuLabel className="text-xs text-slate-500 font-semibold px-2 py-1.5">Actions</DropdownMenuLabel>
                          
                          <DropdownMenuItem 
                            onClick={() => handleUpdateRole(user.id, user.role === 'Admin' ? 'User' : 'Admin')}
                            className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700"
                          >
                            <ShieldAlert className="w-4 h-4 text-slate-400" />
                            {user.role === 'Admin' ? 'Demote to User' : 'Make Admin'}
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => handleUpdateRole(user.id, user.role === 'Agent' ? 'User' : 'Agent')}
                            className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700"
                          >
                            <Edit2 className="w-4 h-4 text-slate-400" />
                            {user.role === 'Agent' ? 'Revoke Agent' : 'Promote to Agent'}
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => handleToggleBan(user.id, user.status)}
                            className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg hover:bg-slate-50 cursor-pointer ${
                              user.status === 'Banned' ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            <Ban className="w-4 h-4" />
                            {user.status === 'Banned' ? 'Unban User' : 'Ban User'}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-slate-100 my-1 h-px" />

                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

