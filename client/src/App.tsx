import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import ClientDetails from "@/pages/ClientDetails";
import Interactions from "@/pages/Interactions";
import AuditLogPage from "@/pages/AuditLog";
import AdminPage from "@/pages/Admin";
import Layout from "@/components/Layout";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

function App() {
  const [location, setLocation] = useLocation();
  const { user, isLoading, checkAuth } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // If not authenticated and not on login page, redirect to login
  useEffect(() => {
    if (!isLoading && !user && location !== "/") {
      toast({
        title: "Authentication required",
        description: "Please log in to access this page",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, isLoading, location, setLocation, toast]);

  return (
    <>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/clients" component={Clients} />
          <Route path="/clients/:id" component={ClientDetails} />
          <Route path="/interactions" component={Interactions} />
          <Route path="/audit-log" component={AuditLogPage} />
          <Route path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
      <Toaster />
    </>
  );
}

export default App;
