// Author Profile Page — UI-only profile editor backed by Supabase profiles table
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Loader2, Save, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type ProfileForm = {
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  website: string;
  twitter: string;
  github: string;
};

const empty: ProfileForm = {
  full_name: "",
  username: "",
  avatar_url: "",
  bio: "",
  website: "",
  twitter: "",
  github: "",
};

export default function AuthorProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>(empty);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("full_name, username, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm((f) => ({
            ...f,
            full_name: data.full_name || "",
            username: data.username || "",
            avatar_url: data.avatar_url || "",
          }));
        }
      })
      .then(() => setLoading(false));
  }, [user]);

  const update = (k: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.full_name.trim()) {
      toast.error("Display name is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        username: form.username.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const initials =
    form.full_name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A";

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/author">Author</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Author Profile</h1>
        <p className="text-sm text-muted-foreground">How buyers see you on the marketplace</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserIcon className="h-4 w-4" /> Public Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={form.avatar_url} alt={form.full_name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  value={form.avatar_url}
                  onChange={update("avatar_url")}
                  placeholder="https://…"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  Display name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={update("full_name")}
                  required
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username / slug</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={update("username")}
                  placeholder="your-handle"
                  maxLength={40}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={update("bio")}
                rows={4}
                maxLength={500}
                placeholder="Tell buyers about yourself…"
              />
              <p className="text-xs text-muted-foreground text-right tabular-nums">
                {form.bio.length}/500
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Socials</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={form.website} onChange={update("website")} placeholder="https://…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter / X</Label>
              <Input id="twitter" value={form.twitter} onChange={update("twitter")} placeholder="@handle" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input id="github" value={form.github} onChange={update("github")} placeholder="username" />
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 -mx-4 sm:mx-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t sm:border-0 p-3 sm:p-0 flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
