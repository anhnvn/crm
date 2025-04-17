import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Admin } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, UserCog, CheckCircle, XCircle } from "lucide-react";
import AdminForm from "@/components/forms/AdminForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminPage() {
  const { user } = useAuth();
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState<Admin | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div className="text-center py-20">
          <UserCog className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
          <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Admin Access Required</h2>
          <p className="text-neutral-500 max-w-md mx-auto">
            You need administrative privileges to access this section.
          </p>
        </div>
      </div>
    );
  }

  // Fetch admins
  const { data: admins = [], isLoading } = useQuery<Admin[]>({
    queryKey: ["/api/admins"],
  });

  const handleAddAdmin = () => {
    setAdminToEdit(null);
    setIsAddAdminOpen(true);
  };

  const handleEditAdmin = (admin: Admin) => {
    setAdminToEdit(admin);
    setIsAddAdminOpen(true);
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    try {
      await apiRequest("DELETE", `/api/admins/${adminToDelete.id}`);
      
      toast({
        title: "Admin deleted",
        description: `${adminToDelete.username} has been removed from administrators.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      setAdminToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete admin",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "Never";
    if (dateString instanceof Date) {
      return dateString.toLocaleString();
    }
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">Admin Management</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Manage administrator accounts and access permissions
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={handleAddAdmin}>
            <Plus className="h-5 w-5 mr-2" />
            Add New Admin
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrators</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading administrators...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.username}</TableCell>
                    <TableCell>{admin.fullName}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell className="capitalize">{admin.role}</TableCell>
                    <TableCell>
                      {admin.active ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <XCircle className="h-4 w-4 mr-1" />
                          <span>Inactive</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(admin.lastLogin)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditAdmin(admin)}
                          disabled={admin.id === user?.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAdminToDelete(admin)}
                          disabled={admin.id === user?.id || admins.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {admins.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                      No administrators found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Admin Dialog */}
      <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <AdminForm
            onSuccess={() => setIsAddAdminOpen(false)}
            admin={adminToEdit}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Admin Dialog */}
      <AlertDialog open={!!adminToDelete} onOpenChange={() => setAdminToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove
              {adminToDelete && ` ${adminToDelete.username}`} from the administrators.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
