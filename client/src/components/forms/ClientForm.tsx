import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema, type Client } from "@shared/schema";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel,
  FormDescription,
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ClientFormValues = z.infer<typeof insertClientSchema>;

interface ClientFormProps {
  client?: Client | null;
  onSuccess: () => void;
}

export default function ClientForm({ client, onSuccess }: ClientFormProps) {
  const isEditing = !!client;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const defaultValues: ClientFormValues = {
    clientID: client?.clientID ?? "",
    firstName: client?.firstName ?? "",
    lastName: client?.lastName ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    address: client?.address ?? "",
    marketType: client?.marketType ?? "local",
    market: client?.market ?? "",
    segment: client?.segment ?? "FIT",
    businessType: client?.businessType ?? "Travel Agent",
    headcountName: client?.headcountName ?? "",
    headcountRole: client?.headcountRole ?? "",
    headcountEmail: client?.headcountEmail ?? "",
    if_active: client?.if_active ?? true,
    name: client?.name ?? "",
  };

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(insertClientSchema),
    defaultValues,
  });

  const onSubmit = async (values: ClientFormValues) => {
    try {
      if (isEditing) {
        await apiRequest("PUT", `/api/clients/${client.clientID}`, values);
        toast({
          title: "Client updated",
          description: `${values.name} has been updated successfully.`,
        });
      } else {
        await apiRequest("POST", `/api/clients`, values);
        toast({
          title: "Client created",
          description: `${values.name} has been added successfully.`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: [`/api/clients/${client.clientID}`] });
      }

      onSuccess();
    } catch (error) {
      const errorResponse = error instanceof Error && 'response' in error ? 
        // @ts-ignore - we know response exists
        await error.response?.json() : null;
      
      toast({
        title: "Error Creating Client",
        description: errorResponse?.message || (error instanceof Error ? error.message : "An unexpected error occurred"),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit Client" : "Add New Client"}</DialogTitle>
        <DialogDescription>
          {isEditing 
            ? "Update the client's information and preferences." 
            : "Add a new client to your travel agency CRM."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">


          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="marketType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select market type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="oversea">Oversea</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="market"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter market" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="segment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Segment</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select segment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FIT">FIT</SelectItem>
                      <SelectItem value="Series">Series</SelectItem>
                      <SelectItem value="Group">Group</SelectItem>
                      <SelectItem value="OTA">OTA</SelectItem>
                      <SelectItem value="Wellness">Wellness</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Tour Operator">Tour Operator</SelectItem>
                      <SelectItem value="Travel Agent">Travel Agent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Headcount Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="headcountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter headcount name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="headcountRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter headcount role" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="headcountEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter headcount email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="if_active"
            defaultValue={false}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-x-4 rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Active</FormLabel>
                  <FormDescription>
                    Set whether this client is currently active
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? isEditing ? "Updating..." : "Creating..."
                : isEditing ? "Update Client" : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}