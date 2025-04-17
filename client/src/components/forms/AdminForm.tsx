import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { insertAdminSchema, type Admin } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Extend the schema with additional validation rules
const adminFormSchema = insertAdminSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "user"]),
  active: z.boolean().optional(),
});

type AdminFormValues = z.infer<typeof adminFormSchema>;

interface AdminFormProps {
  admin?: Admin | null;
  onSuccess: () => void;
}

export default function AdminForm({ admin, onSuccess }: AdminFormProps) {
  const isEditing = !!admin;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Default values for the form
  const defaultValues: AdminFormValues = {
    username: admin?.username ?? "",
    password: "", // Password is blank when editing
    fullName: admin?.fullName ?? "",
    email: admin?.email ?? "",
    role: (admin?.role as "admin" | "user") ?? "user",
    active: admin?.active ?? true,
  };

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(
      // Modify schema for editing (password optional when editing)
      isEditing 
        ? adminFormSchema
        : adminFormSchema.extend({ password: z.string().min(6, "Password must be at least 6 characters") })
    ),
    defaultValues,
  });

  const onSubmit = async (values: AdminFormValues) => {
    try {
      // If editing and password is empty, remove it from the request
      if (isEditing && !values.password) {
        const { password, ...adminData } = values;
        
        await apiRequest("PUT", `/api/admins/${admin.id}`, adminData);
        toast({
          title: "Admin updated",
          description: `${values.username} has been updated successfully.`,
        });
      } else if (isEditing) {
        await apiRequest("PUT", `/api/admins/${admin.id}`, values);
        toast({
          title: "Admin updated",
          description: `${values.username} has been updated successfully.`,
        });
      } else {
        await apiRequest("POST", `/api/admins`, values);
        toast({
          title: "Admin created",
          description: `${values.username} has been added successfully.`,
        });
      }
      
      // Invalidate queries to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit Administrator" : "Add New Administrator"}</DialogTitle>
        <DialogDescription>
          {isEditing 
            ? "Update the administrator's information and access permissions." 
            : "Add a new administrator to manage the CRM system."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Username */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter username" 
                    {...field} 
                    disabled={isEditing} // Can't change username when editing
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"} 
                    {...field} 
                  />
                </FormControl>
                {isEditing && (
                  <FormDescription>
                    Leave blank to keep the current password
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Full Name */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email address" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="user">Standard User</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Administrators have access to all features, including user management
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Active Status */}
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Account</FormLabel>
                  <FormDescription>
                    Inactive accounts cannot log in to the system
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? isEditing ? "Updating..." : "Creating..."
                : isEditing ? "Update Administrator" : "Create Administrator"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
