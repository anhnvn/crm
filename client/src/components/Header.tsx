import { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AvatarInitials from "@/components/ui/avatar-initials";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export default function Header({ onMobileMenuToggle, isMobileMenuOpen }: HeaderProps) {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ) },
    { href: "/clients", label: "Clients", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ) },
    { href: "/interactions", label: "Interactions", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ) },
    { href: "/audit-log", label: "Audit Log", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ) },
    { href: "/admin", label: "Admin", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) },
  ];

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMenuOpen(true)}
            className="mr-2"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="ml-2 text-lg font-semibold text-primary-500">TravelCRM</h1>
        </div>
        
        {/* Search */}
        <div className="flex-1 max-w-3xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input 
              type="text" 
              placeholder="Search for clients, interactions..." 
              className="block w-full pl-10 pr-4 py-2"
            />
          </div>
        </div>
        
        {/* Right Side Actions */}
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2">
            <Bell className="h-5 w-5" />
          </Button>
          
          <div className="hidden md:flex md:items-center md:ml-4">
            {user && <AvatarInitials name={user.username} />}
          </div>
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="p-0">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h1 className="text-xl font-semibold text-primary-500">TravelCRM</h1>
          </div>
          
          <div className="flex flex-col flex-grow pt-4">
            <nav className="flex-1 px-2 space-y-1">
              {links.map((link) => {
                // Don't show admin link for non-admin users
                if (link.href === "/admin" && user?.role !== "admin") {
                  return null;
                }
                
                const isActive = location === link.href || 
                                (link.href !== "/" && location.startsWith(link.href));
                
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-md",
                      isActive 
                        ? "bg-primary-50 text-primary-600" 
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-primary-600"
                    )}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {user && (
            <div className="border-t border-neutral-200 p-4 mt-auto">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <AvatarInitials name={user.username} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-700 truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </header>
  );
}
