import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Camera,
  DollarSign,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Palette,
  Phone,
  Save,
  Shield,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

interface InstructorProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  bio: string;
  specializations: string[];
  hourlyRate: number;
  availability: string;
  avatar?: string;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  lessonReminders: boolean;
  studentUpdates: boolean;
  paymentNotifications: boolean;
  marketingEmails: boolean;
}

interface AppSettings {
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
}

interface UserSettings {
  profile: InstructorProfile;
  notifications: NotificationSettings;
  app: AppSettings;
  security: {
    twoFactorEnabled: boolean;
  };
}

export default function InstructorSettingsPage() {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState<InstructorProfile>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    licenseNumber: "",
    bio: "",
    specializations: [],
    hourlyRate: 45,
    availability: "weekdays",
    avatar: user?.profileImageUrl || undefined,
  });

  const [securityData, setSecurityData] = useState<SecuritySettings>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  });

  const [notificationData, setNotificationData] =
    useState<NotificationSettings>({
      emailNotifications: true,
      smsNotifications: false,
      lessonReminders: true,
      studentUpdates: true,
      paymentNotifications: true,
      marketingEmails: false,
    });

  const [appData, setAppData] = useState<AppSettings>({
    theme: "system",
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
  });

  // Fetch instructor settings
  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/instructor/settings"],
    enabled: isAuthenticated,
  });

  // Update state when settings data changes
  useEffect(() => {
    if (settings) {
      setProfileData((prev) => ({ ...prev, ...settings.profile }));
      setNotificationData((prev) => ({ ...prev, ...settings.notifications }));
      setAppData((prev) => ({ ...prev, ...settings.app }));
      setSecurityData((prev) => ({
        ...prev,
        twoFactorEnabled: settings.security?.twoFactorEnabled || false,
      }));
    }
  }, [settings]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: InstructorProfile) => {
      const response = await fetch("/api/instructor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Success", description: "Profile updated successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update password");
      return response.json();
    },
    onSuccess: () => {
      setSecurityData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      toast({ title: "Success", description: "Password updated successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    },
  });

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      const response = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update notifications");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notifications",
        variant: "destructive",
      });
    },
  });

  // Update app settings mutation
  const updateAppSettingsMutation = useMutation({
    mutationFn: async (data: AppSettings) => {
      const response = await fetch("/api/user/app-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update app settings");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "App settings updated" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update app settings",
        variant: "destructive",
      });
    },
  });

  const handleProfileSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSave = () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (securityData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: securityData.currentPassword,
      newPassword: securityData.newPassword,
    });
  };

  const handleNotificationsSave = () => {
    updateNotificationsMutation.mutate(notificationData);
  };

  const handleAppSettingsSave = () => {
    updateAppSettingsMutation.mutate(appData);
  };

  const addSpecialization = (specialization: string) => {
    if (
      specialization &&
      !profileData.specializations.includes(specialization)
    ) {
      setProfileData((prev) => ({
        ...prev,
        specializations: [...prev.specializations, specialization],
      }));
    }
  };

  const removeSpecialization = (specialization: string) => {
    setProfileData((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((s) => s !== specialization),
    }));
  };

  if (isLoading) {
    return <div className="p-8">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Instructor Settings</h1>
        <p className="text-muted-foreground">
          Manage your instructor profile and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Instructor Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback className="text-lg">
                    {profileData.firstName?.[0]}
                    {profileData.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" className="mr-2">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        firstName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        lastName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      className="pl-10"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="licenseNumber"
                      value={profileData.licenseNumber}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          licenseNumber: e.target.value,
                        })
                      }
                      className="pl-10"
                      placeholder="INST-12345"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="5"
                      value={profileData.hourlyRate}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          hourlyRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <Select
                    value={profileData.availability}
                    onValueChange={(value) =>
                      setProfileData({ ...profileData, availability: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekdays">Weekdays Only</SelectItem>
                      <SelectItem value="weekends">Weekends Only</SelectItem>
                      <SelectItem value="flexible">
                        Flexible Schedule
                      </SelectItem>
                      <SelectItem value="evenings">Evenings Only</SelectItem>
                      <SelectItem value="mornings">Mornings Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="specializations">Specializations</Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profileData.specializations.map((spec, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {spec}
                        <button
                          onClick={() => removeSpecialization(spec)}
                          className="ml-1 text-xs hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select onValueChange={addSpecialization}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Add specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manual Transmission">
                          Manual Transmission
                        </SelectItem>
                        <SelectItem value="Highway Driving">
                          Highway Driving
                        </SelectItem>
                        <SelectItem value="Parallel Parking">
                          Parallel Parking
                        </SelectItem>
                        <SelectItem value="Defensive Driving">
                          Defensive Driving
                        </SelectItem>
                        <SelectItem value="Night Driving">
                          Night Driving
                        </SelectItem>
                        <SelectItem value="Teen Driver Education">
                          Teen Driver Education
                        </SelectItem>
                        <SelectItem value="Senior Refresher">
                          Senior Refresher
                        </SelectItem>
                        <SelectItem value="Commercial License">
                          Commercial License
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  placeholder="Describe your experience, teaching philosophy, and what makes you a great instructor..."
                  className="min-h-[120px]"
                />
              </div>

              <Button
                onClick={handleProfileSave}
                disabled={updateProfileMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={securityData.currentPassword}
                      onChange={(e) =>
                        setSecurityData({
                          ...securityData,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={securityData.newPassword}
                      onChange={(e) =>
                        setSecurityData({
                          ...securityData,
                          newPassword: e.target.value,
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={securityData.confirmPassword}
                      onChange={(e) =>
                        setSecurityData({
                          ...securityData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handlePasswordSave}
                  disabled={updatePasswordMutation.isPending}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {updatePasswordMutation.isPending
                    ? "Updating..."
                    : "Update Password"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      Enable Two-Factor Authentication
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your instructor account
                    </p>
                  </div>
                  <Switch
                    checked={securityData.twoFactorEnabled}
                    onCheckedChange={(checked) =>
                      setSecurityData({
                        ...securityData,
                        twoFactorEnabled: checked,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationData.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationData({
                        ...notificationData,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={notificationData.smsNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationData({
                        ...notificationData,
                        smsNotifications: checked,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Lesson Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about upcoming lessons
                    </p>
                  </div>
                  <Switch
                    checked={notificationData.lessonReminders}
                    onCheckedChange={(checked) =>
                      setNotificationData({
                        ...notificationData,
                        lessonReminders: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Student Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Notifications about student progress and updates
                    </p>
                  </div>
                  <Switch
                    checked={notificationData.studentUpdates}
                    onCheckedChange={(checked) =>
                      setNotificationData({
                        ...notificationData,
                        studentUpdates: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified about payment receipts and earnings
                    </p>
                  </div>
                  <Switch
                    checked={notificationData.paymentNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationData({
                        ...notificationData,
                        paymentNotifications: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and promotions
                    </p>
                  </div>
                  <Switch
                    checked={notificationData.marketingEmails}
                    onCheckedChange={(checked) =>
                      setNotificationData({
                        ...notificationData,
                        marketingEmails: checked,
                      })
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleNotificationsSave}
                disabled={updateNotificationsMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateNotificationsMutation.isPending
                  ? "Saving..."
                  : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={appData.theme}
                    onValueChange={(value) =>
                      setAppData({ ...appData, theme: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={appData.language}
                    onValueChange={(value) =>
                      setAppData({ ...appData, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={appData.timezone}
                    onValueChange={(value) =>
                      setAppData({ ...appData, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={appData.dateFormat}
                    onValueChange={(value) =>
                      setAppData({ ...appData, dateFormat: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={appData.currency}
                  onValueChange={(value) =>
                    setAppData({ ...appData, currency: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAppSettingsSave}
                disabled={updateAppSettingsMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateAppSettingsMutation.isPending
                  ? "Saving..."
                  : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
