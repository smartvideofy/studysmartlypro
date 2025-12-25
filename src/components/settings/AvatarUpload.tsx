import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  avatarUrl: string | null;
  fullName: string;
  email: string;
}

export function AvatarUpload({ avatarUrl, fullName, email }: AvatarUploadProps) {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = () => {
    if (fullName) return fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    return email?.[0]?.toUpperCase() || "U";
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      updateProfile.mutate({ avatar_url: urlWithCacheBuster });
    } catch (error: any) {
      toast.error("Failed to upload avatar: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div 
        className={cn(
          "w-16 h-16 rounded-full overflow-hidden flex items-center justify-center",
          "bg-primary/10 text-primary font-semibold text-xl",
          "transition-transform group-hover:scale-105"
        )}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials()}</span>
        )}
      </div>
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          "rounded-full bg-black/50 opacity-0 group-hover:opacity-100",
          "transition-opacity cursor-pointer"
        )}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Camera className="w-5 h-5 text-white" />
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
