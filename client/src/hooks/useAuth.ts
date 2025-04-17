import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

type User = {
  id: number;
  username: string;
  role: string;
};

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser, clearUser } = useAuthStore();
  const queryClient = useQueryClient();

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        } else {
          clearUser();
        }
      } else {
        clearUser();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      clearUser();
    } finally {
      setIsLoading(false);
    }
  }, [setUser, clearUser]);

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await response.json();
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Login failed");
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      clearUser();
      queryClient.clear();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return {
    user,
    isLoading,
    login,
    logout,
    checkAuth,
  };
};
