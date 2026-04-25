// Author Upload Item Page
// Form for creating new marketplace items

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { authorItemsApiService } from "@/lib/marketplace/author-items-api";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Upload as UploadIcon, Loader2 } from "lucide-react";

function AuthorUploadItem() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

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
    version: "1.0.0",
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
    fileType: "application/zip",
    // Legal
    licenseDeclaration: "own" as "own" | "third-party",
    thirdPartyLicenseInfo: "",
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [originalWorkConfirmed, setOriginalWorkConfirmed] = useState(false);
  const [showRules, setShowRules] = useState(true);

  const categories = [
    "WordPress",
    "HTML Templates",
    "React",
    "Vue",
    "Angular",
    "Laravel",
    "PHP Scripts",
    "Node.js",
    "Python",
    "Mobile Apps",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!formData.category) {
      toast.error("Category is required");
      return;
    }
    if (!formData.subcategory) {
      toast.error("Subcategory is required");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Valid price is required");
      return;
    }
    if (!formData.demoUrl.trim()) {
      toast.error("Demo URL is required");
      return;
    }
    if (!formData.fileUrl.trim()) {
      toast.error("ZIP file is required");
      return;
    }
    if (!asDraft && (!termsAccepted || !originalWorkConfirmed)) {
      toast.error("You must agree to the terms and legal conditions");
      return;
    }

    const submitFn = asDraft ? setIsSavingDraft : setIsSubmitting;
    submitFn(true);

    try {
      const res = await authorItemsApiService.createItem({
        userId: user.id,
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
        version: formData.version,
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
        // Legal
        termsAccepted: termsAccepted,
        originalWorkConfirmed: originalWorkConfirmed,
        licenseDeclaration: formData.licenseDeclaration,
        thirdPartyLicenseInfo: formData.thirdPartyLicenseInfo,
      });

      if (res.success) {
        toast.success(asDraft ? "Draft saved successfully" : "Item submitted for approval");
        navigate("/author/items");
      } else {
        toast.error(res.error || "Failed to create item");
      }
    } catch (error) {
      toast.error("Failed to create item");
    } finally {
      setIsSubmitting(false);
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/author")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Upload New Item</h1>
          <p className="text-muted-foreground">Create a new marketplace item</p>
        </div>
      </div>

      {/* Author Rules Panel */}
      {showRules && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-300">Author Rules & Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="list-disc list-inside space-y-1 text-yellow-800 dark:text-yellow-200">
              <li>No copied, nulled, or pirated code</li>
              <li>No copyrighted assets without proper license</li>
              <li>Clean, working demo is required</li>
              <li>Proper documentation must be included</li>
              <li>No illegal, harmful, or malicious content</li>
              <li>No spam or duplicate items</li>
              <li>No fake or misleading demos</li>
            </ul>
            <Button variant="outline" size="sm" onClick={() => setShowRules(false)} className="mt-4">
              I Understand, Continue
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., NovaPress WordPress Theme"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your item in detail..."
                  rows={6}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="subcategory">Subcategory *</Label>
                  <Input
                    id="subcategory"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    placeholder="e.g., Business"
                  />
                </div>

                <div>
                  <Label htmlFor="microcategory">Microcategory</Label>
                  <Input
                    id="microcategory"
                    name="microcategory"
                    value={formData.microcategory}
                    onChange={handleInputChange}
                    placeholder="e.g., SaaS"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="29.00"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="wordpress, theme, elementor"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL-friendly)</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="auto-generated from title"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to auto-generate from title
                </p>
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
                  placeholder="SEO title (optional)"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  placeholder="SEO description (optional)"
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
                  placeholder="https://example.com/og-image.jpg"
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
                    placeholder="149.00"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="licenseKeyRequired"
                  checked={formData.licenseKeyRequired}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, licenseKeyRequired: checked }))}
                />
                <Label htmlFor="licenseKeyRequired" className="text-sm">
                  Require License Key
                </Label>
              </div>

              <div>
                <Label htmlFor="licenseDeclaration">License Declaration *</Label>
                <select
                  id="licenseDeclaration"
                  name="licenseDeclaration"
                  value={formData.licenseDeclaration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="own">This is my own original code</option>
                  <option value="third-party">This includes third-party assets</option>
                </select>
              </div>

              {formData.licenseDeclaration === "third-party" && (
                <div>
                  <Label htmlFor="thirdPartyLicenseInfo">Third-Party License Info</Label>
                  <Textarea
                    id="thirdPartyLicenseInfo"
                    name="thirdPartyLicenseInfo"
                    value={formData.thirdPartyLicenseInfo}
                    onChange={handleInputChange}
                    placeholder="List third-party assets and their licenses..."
                    rows={3}
                  />
                </div>
              )}
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
                  placeholder="support@example.com"
                />
              </div>

              <div>
                <Label htmlFor="supportDuration">Support Duration</Label>
                <Input
                  id="supportDuration"
                  name="supportDuration"
                  value={formData.supportDuration}
                  onChange={handleInputChange}
                  placeholder="e.g., 6 months, 1 year"
                />
              </div>

              <div>
                <Label htmlFor="documentationUrl">Documentation URL</Label>
                <Input
                  id="documentationUrl"
                  name="documentationUrl"
                  value={formData.documentationUrl}
                  onChange={handleInputChange}
                  placeholder="https://docs.example.com"
                />
              </div>

              <div>
                <Label htmlFor="compatibility">Compatibility (comma-separated)</Label>
                <Input
                  id="compatibility"
                  name="compatibility"
                  value={formData.compatibility}
                  onChange={handleInputChange}
                  placeholder="WordPress 5.0+, PHP 7.4+, MySQL 5.7+"
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
                <Label htmlFor="demoUrl">Demo URL *</Label>
                <Input
                  id="demoUrl"
                  name="demoUrl"
                  value={formData.demoUrl}
                  onChange={handleInputChange}
                  placeholder="https://demo.example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A live demo is required for approval
                </p>
              </div>

              <div>
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  name="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>

              <div>
                <Label htmlFor="fileUrl">ZIP File URL *</Label>
                <div className="flex gap-2">
                  <Input
                    id="fileUrl"
                    name="fileUrl"
                    value={formData.fileUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/item.zip"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <UploadIcon className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload your item as a ZIP file (max 500MB)
                </p>
              </div>

              <div>
                <Label htmlFor="videoPreviewUrl">Video Preview URL (optional)</Label>
                <Input
                  id="videoPreviewUrl"
                  name="videoPreviewUrl"
                  value={formData.videoPreviewUrl}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  name="version"
                  value={formData.version}
                  onChange={handleInputChange}
                  placeholder="1.0.0"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fileSize">File Size (bytes)</Label>
                  <Input
                    id="fileSize"
                    name="fileSize"
                    type="number"
                    value={formData.fileSize}
                    onChange={handleInputChange}
                    placeholder="Auto-detected"
                  />
                </div>

                <div>
                  <Label htmlFor="fileType">File Type</Label>
                  <Input
                    id="fileType"
                    name="fileType"
                    value={formData.fileType}
                    onChange={handleInputChange}
                    placeholder="application/zip"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || isSavingDraft}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Approval"
                )}
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting || isSavingDraft}
                variant="outline"
                className="w-full"
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save as Draft"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legal & Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={setTermsAccepted}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the marketplace terms of service
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="legal"
                  checked={originalWorkConfirmed}
                  onCheckedChange={setOriginalWorkConfirmed}
                />
                <Label htmlFor="legal" className="text-sm">
                  I confirm this is my original work (no copied content)
                </Label>
              </div>

              <p className="text-xs text-muted-foreground">
                By submitting, you agree to our DMCA policy and terms of service.
                Violations may result in account suspension.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AuthorUploadItem;
