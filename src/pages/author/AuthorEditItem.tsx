// Author Edit Item Page
// Edit existing marketplace items with version management

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { authorItemsApiService } from "@/lib/marketplace/author-items-api";
import type { ItemEntity, ItemVersionEntity } from "@/lib/marketplace/author-items-schema";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Loader2, Upload as UploadIcon, History } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function AuthorEditItem() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [item, setItem] = useState<ItemEntity | null>(null);
  const [versions, setVersions] = useState<ItemVersionEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    microcategory: "",
    price: "",
    demoUrl: "",
    thumbnailUrl: "",
    fileUrl: "",
    tags: "",
    // SEO
    slug: "",
    metaTitle: "",
    metaDescription: "",
    ogImageUrl: "",
    // License
    licenseType: "regular" as "regular" | "extended",
    extendedPrice: "",
    licenseKeyRequired: false,
    // Preview
    videoPreviewUrl: "",
    // Support
    supportEmail: "",
    supportDuration: "",
    // Documentation
    documentationUrl: "",
    // Compatibility
    compatibility: "",
    // File Security
    fileSize: 0,
    fileType: "",
  });

  const [versionForm, setVersionForm] = useState({
    version: "",
    fileUrl: "",
    changelog: "",
  });

  useEffect(() => {
    if (id) {
      loadItem(id);
      loadVersions(id);
    }
  }, [id]);

  const loadItem = async (itemId: string) => {
    setIsLoading(true);
    try {
      const res = await authorItemsApiService.getItem(itemId);
      if (res.success && res.data) {
        setItem(res.data);
        setFormData({
          title: res.data.title,
          description: res.data.description,
          category: res.data.category,
          subcategory: res.data.subcategory,
          microcategory: res.data.microcategory || "",
          price: res.data.price.toString(),
          demoUrl: res.data.demoUrl,
          thumbnailUrl: res.data.thumbnailUrl || "",
          fileUrl: res.data.fileUrl,
          tags: res.data.tags.join(", "),
          // SEO
          slug: res.data.slug,
          metaTitle: res.data.metaTitle || "",
          metaDescription: res.data.metaDescription || "",
          ogImageUrl: res.data.ogImageUrl || "",
          // License
          licenseType: res.data.licenseType,
          extendedPrice: res.data.extendedPrice?.toString() || "",
          licenseKeyRequired: res.data.licenseKeyRequired,
          // Preview
          videoPreviewUrl: res.data.videoPreviewUrl || "",
          // Support
          supportEmail: res.data.supportEmail || "",
          supportDuration: res.data.supportDuration || "",
          // Documentation
          documentationUrl: res.data.documentationUrl || "",
          // Compatibility
          compatibility: res.data.compatibility?.join(", ") || "",
          // File Security
          fileSize: res.data.fileSize,
          fileType: res.data.fileType,
        });
      }
    } catch (error) {
      toast.error("Failed to load item");
    } finally {
      setIsLoading(false);
    }
  };

  const loadVersions = async (itemId: string) => {
    try {
      const res = await authorItemsApiService.getItemVersions(itemId);
      if (res.success && res.data) {
        setVersions(res.data);
      }
    } catch (error) {
      console.error("Failed to load versions");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleVersionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setVersionForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!item || !user) return;

    setIsSaving(true);
    try {
      const res = await authorItemsApiService.updateItem(item.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        microcategory: formData.microcategory,
        price: parseFloat(formData.price),
        demoUrl: formData.demoUrl,
        thumbnailUrl: formData.thumbnailUrl,
        fileUrl: formData.fileUrl,
        tags: formData.tags.split(",").map(t => t.trim()).filter(t => t),
        // SEO
        slug: formData.slug,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        ogImageUrl: formData.ogImageUrl,
        // License
        licenseType: formData.licenseType,
        extendedPrice: formData.extendedPrice ? parseFloat(formData.extendedPrice) : undefined,
        licenseKeyRequired: formData.licenseKeyRequired,
        // Preview
        videoPreviewUrl: formData.videoPreviewUrl,
        // Support
        supportEmail: formData.supportEmail,
        supportDuration: formData.supportDuration,
        // Documentation
        documentationUrl: formData.documentationUrl,
        // Compatibility
        compatibility: formData.compatibility ? formData.compatibility.split(",").map(t => t.trim()).filter(t => t) : undefined,
        // File Security
        fileSize: formData.fileSize,
        fileType: formData.fileType,
      });

      if (res.success) {
        toast.success("Item updated successfully");
        loadItem(item.id);
      } else {
        toast.error(res.error || "Failed to update item");
      }
    } catch (error) {
      toast.error("Failed to update item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!item) return;

    if (!versionForm.version || !versionForm.fileUrl || !versionForm.changelog) {
      toast.error("Version, file, and changelog are required");
      return;
    }

    setIsCreatingVersion(true);
    try {
      const res = await authorItemsApiService.createVersion({
        itemId: item.id,
        version: versionForm.version,
        fileUrl: versionForm.fileUrl,
        changelog: versionForm.changelog,
      });

      if (res.success) {
        toast.success("Version created successfully");
        setVersionForm({ version: "", fileUrl: "", changelog: "" });
        loadVersions(item.id);
        loadItem(item.id);
      } else {
        toast.error(res.error || "Failed to create version");
      }
    } catch (error) {
      toast.error("Failed to create version");
    } finally {
      setIsCreatingVersion(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Item not found</p>
        <Button onClick={() => navigate("/author/items")} className="mt-4">
          Back to Items
        </Button>
      </div>
    );
  }

  const canEdit = item.status === "draft" || item.status === "rejected";
  const canCreateVersion = item.status === "approved";

  const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    approved: "default",
    draft: "secondary",
    pending: "outline",
    rejected: "destructive",
    soft_rejected: "destructive",
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/author">Author</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/author/items">My Items</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate("/author/items")} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">Edit Item</h1>
            <Badge variant={statusVariant[item.status] ?? "secondary"} className="capitalize">
              {item.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate" title={item.title}>{item.title}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  rows={6}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label htmlFor="microcategory">Microcategory</Label>
                  <Input
                    id="microcategory"
                    name="microcategory"
                    value={formData.microcategory}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL-friendly)</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="ogImageUrl">OG Image URL</Label>
                <Input
                  id="ogImageUrl"
                  name="ogImageUrl"
                  value={formData.ogImageUrl}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>License & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="licenseType">License Type</Label>
                <select
                  id="licenseType"
                  name="licenseType"
                  value={formData.licenseType}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="regular">Regular License</option>
                  <option value="extended">Extended License</option>
                </select>
              </div>

              {formData.licenseType === "extended" && (
                <div>
                  <Label htmlFor="extendedPrice">Extended License Price ($)</Label>
                  <Input
                    id="extendedPrice"
                    name="extendedPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.extendedPrice}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="licenseKeyRequired"
                  checked={formData.licenseKeyRequired}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, licenseKeyRequired: checked }))
                  }
                  disabled={!canEdit}
                />
                <Label htmlFor="licenseKeyRequired" className="text-sm">
                  Require License Key
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support & Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  name="supportEmail"
                  type="email"
                  value={formData.supportEmail}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Label htmlFor="supportDuration">Support Duration</Label>
                <Input
                  id="supportDuration"
                  name="supportDuration"
                  value={formData.supportDuration}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Label htmlFor="documentationUrl">Documentation URL</Label>
                <Input
                  id="documentationUrl"
                  name="documentationUrl"
                  value={formData.documentationUrl}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Label htmlFor="compatibility">Compatibility (comma-separated)</Label>
                <Input
                  id="compatibility"
                  name="compatibility"
                  value={formData.compatibility}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Files & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="demoUrl">Demo URL</Label>
                <Input
                  id="demoUrl"
                  name="demoUrl"
                  value={formData.demoUrl}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  name="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={handleInputChange}
                  disabled={!canEdit}
                />
              </div>

              <div>
                <Label htmlFor="fileUrl">ZIP File URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="fileUrl"
                    name="fileUrl"
                    value={formData.fileUrl}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  />
                  <Button type="button" variant="outline" size="icon" disabled={!canEdit}>
                    <UploadIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {canEdit && (
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Version History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No versions yet</p>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div key={version.id} className="border rounded p-3">
                      <div className="font-medium">{version.version}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm mt-1">{version.changelog}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {canCreateVersion && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Version</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    name="version"
                    value={versionForm.version}
                    onChange={handleVersionInputChange}
                    placeholder="1.1.0"
                  />
                </div>

                <div>
                  <Label htmlFor="versionFile">File URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="versionFile"
                      name="fileUrl"
                      value={versionForm.fileUrl}
                      onChange={handleVersionInputChange}
                      placeholder="https://example.com/item-v1.1.0.zip"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <UploadIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="changelog">Changelog</Label>
                  <Textarea
                    id="changelog"
                    name="changelog"
                    value={versionForm.changelog}
                    onChange={handleVersionInputChange}
                    placeholder="What's new in this version?"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleCreateVersion}
                  disabled={isCreatingVersion}
                  className="w-full"
                >
                  {isCreatingVersion ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Version"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{item.status}</div>
              {item.rejectionReason && (
                <p className="text-sm text-destructive mt-2">{item.rejectionReason}</p>
              )}
              <div className="text-sm text-muted-foreground mt-2">
                Version: {item.version}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AuthorEditItem;
