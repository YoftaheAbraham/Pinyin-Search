import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Loader2, Plus, Shield, ShieldCheck, ShieldX, Users } from 'lucide-react'
import React, { useEffect, useState } from 'react'


type AdminUser = {
    id: number
    username: string
    email: string
    role: string
    isActive: boolean
    createdAt?: string
}

const AdminsController = () => {

    const [admins, setAdmins] = useState<AdminUser[]>([])
    const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
    const [newAdmin, setNewAdmin] = useState({ username: "", email: "", password: "", role: "admin" })
    const [isAddingAdmin, setIsAddingAdmin] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [updatingAdminIds, setUpdatingAdminIds] = useState<Set<number>>(new Set())

    const { user, logout } = useAuth()
    const { success, error } = useToast()
    const fetchAdmins = async () => {
        try {
            setIsLoadingAdmins(true)
            const response = await fetch("/api/admins")
            const data = await response.json()

            console.log(data);

            if (data.success) {
                setAdmins(data.data)
            } else {
                console.error("Failed to fetch admins:", data.message)
            }
        } catch (error) {
            console.error("Error fetching admins:", error)
        } finally {
            setIsLoadingAdmins(false)
        }
    }

    useEffect(() => {
        fetchAdmins()
    }, [])

    const handleAddAdmin = async () => {
        if (newAdmin.username && newAdmin.email && newAdmin.password) {
            try {
                setIsAddingAdmin(true)
                const response = await fetch("/api/admins", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(newAdmin),
                })

                const data = await response.json()

                if (data.success) {
                    setAdmins([...admins, data.data])
                    setNewAdmin({ username: "", email: "", password: "", role: "admin" })
                    success("Admin Added", "New admin created successfully")
                } else {
                    error("Failed to Add Admin", data.message || "An error occurred while creating the admin")
                }
            } catch (err) {
                error("Network Error", "Failed to connect to the server")
            } finally {
                setIsAddingAdmin(false)
            }
        }
    }

    const handleToggleAdminStatus = async (adminId: number, currentStatus: boolean) => {
        try {
            setUpdatingAdminIds((prev) => new Set(prev).add(adminId))
            const response = await fetch(`/api/admins/${adminId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            })

            const data = await response.json()

            if (data.success) {
                setAdmins(admins.map((admin) => (admin.id === adminId ? { ...admin, isActive: !currentStatus } : admin)))
                success(
                    !currentStatus ? "Admin Activated" : "Admin Deactivated",
                    `Admin has been ${!currentStatus ? "activated" : "deactivated"} successfully`,
                )
            } else {
                error("Failed to Update Admin", data.message || "An error occurred while updating the admin")
            }
        } catch (err) {
            error("Network Error", "Failed to connect to the server")
        } finally {
            setUpdatingAdminIds((prev) => {
                const newSet = new Set(prev)
                newSet.delete(adminId)
                return newSet
            })
        }
    }




    return (
        <>
            <div className="border rounded-lg p-6 mb-8">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Add New Admin
                        <div className="ml-auto">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                <Shield className="h-3 w-3" />
                                Secure Access
                            </div>
                        </div>
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="new-admin-username" className="text-sm font-medium mb-1 block">
                            Username
                        </label>
                        <input
                            id="new-admin-username"
                            placeholder="admin_user"
                            value={newAdmin.username}
                            onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label htmlFor="new-admin-email" className="text-sm font-medium mb-1 block">
                            Email
                        </label>
                        <input
                            id="new-admin-email"
                            type="email"
                            placeholder="admin@example.com"
                            value={newAdmin.email}
                            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label htmlFor="new-admin-password" className="text-sm font-medium mb-1 block">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="new-admin-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={newAdmin.password}
                                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="new-admin-role" className="text-sm font-medium mb-1 block">
                            Role
                        </label>
                        <select
                            id="new-admin-role"
                            value={newAdmin.role}
                            onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="moderator">Moderator</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleAddAdmin}
                        disabled={isAddingAdmin || !newAdmin.username || !newAdmin.email || !newAdmin.password}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
                    >
                        {isAddingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        {isAddingAdmin ? "Creating..." : "Create Admin"}
                    </button>
                </div>
            </div>
            <div className="border rounded-lg p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Admin Users ({admins.length})
                    </h2>
                </div>

                {isLoadingAdmins ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Loading admin users...</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {admins.map((admin) => (
                            <div
                                key={admin.id}
                                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                                        <div>
                                            <div className="text-sm text-muted-foreground mb-1">Username</div>
                                            <div className="font-semibold">{admin.username}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground mb-1">Email</div>
                                            <div className="text-sm">{admin.email}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground mb-1">Role</div>
                                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                <Shield className="h-3 w-3" />
                                                {admin.role}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground mb-1">Status</div>
                                            <div
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${admin.isActive
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                                    }`}
                                            >
                                                {admin.isActive ? <ShieldCheck className="h-3 w-3" /> : <ShieldX className="h-3 w-3" />}
                                                {admin.isActive ? "Active" : "Inactive"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleToggleAdminStatus(admin.id, admin.isActive)}
                                            disabled={updatingAdminIds.has(admin.id) || (admin.id as any) === user?.id}
                                            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3 py-2 gap-2 ${admin.isActive
                                                ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                                : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                                                }`}
                                        >
                                            {updatingAdminIds.has(admin.id) ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : admin.isActive ? (
                                                <ShieldX className="h-4 w-4" />
                                            ) : (
                                                <ShieldCheck className="h-4 w-4" />
                                            )}
                                            {updatingAdminIds.has(admin.id) ? "Updating..." : admin.isActive ? "Deactivate" : "Activate"}
                                        </button>
                                    </div>
                                </div>
                                {(admin.id as any) === user?.id && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        This is your account - you cannot deactivate yourself
                                    </div>
                                )}
                            </div>
                        ))}

                        {admins.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No admin users found. Create your first admin above.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}

export default AdminsController