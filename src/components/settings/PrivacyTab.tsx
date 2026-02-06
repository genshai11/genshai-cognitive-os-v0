import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const PrivacyTab = () => {
  const { user, signOut } = useAuth();

  const exportData = async () => {
    if (!user) return;
    try {
      const [profileRes, convoRes, interestsRes] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("user_id", user.id),
        supabase.from("conversations").select("*, messages(*)").eq("user_id", user.id),
        supabase.from("user_interests").select("*").eq("user_id", user.id),
      ]);
      
      const exportObj = {
        exported_at: new Date().toISOString(),
        profile: profileRes.data?.[0] || null,
        conversations: convoRes.data || [],
        interests: interestsRes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindboard-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully!");
    } catch {
      toast.error("Failed to export data");
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      // Delete user data (cascade will handle related records)
      await Promise.all([
        supabase.from("user_profiles").delete().eq("user_id", user.id),
        supabase.from("conversations").delete().eq("user_id", user.id),
        supabase.from("user_interests").delete().eq("user_id", user.id),
      ]);
      await signOut();
      toast.success("Account data deleted. You have been signed out.");
    } catch {
      toast.error("Failed to delete account data");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold font-serif mb-1">Privacy & Data</h2>
        <p className="text-sm text-muted-foreground">
          Manage your data and privacy settings.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="font-semibold">Export Your Data</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Download all your profile data, conversations, and preferences as a JSON file.
          </p>
        </div>
        <Button variant="outline" onClick={exportData} className="gap-2">
          <Download className="w-4 h-4" /> Export All Data
        </Button>
      </section>

      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-destructive">Delete Account Data</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Permanently delete all your profile data, conversation history, and preferences. This cannot be undone.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="w-4 h-4" /> Delete All Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your data including profile, conversations, and preferences. You will be signed out.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
};
