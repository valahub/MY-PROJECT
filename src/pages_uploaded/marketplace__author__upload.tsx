import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_TREE } from "@/lib/marketplace-data";
import { useState } from "react";
import { toast } from "sonner";
import { UploadCloud, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { getUiErrorMessage, submitMarketplaceItem } from "@/lib/ui-actions-api";
import { useSelfHealingAction } from "@/hooks/use-self-healing-action";

({ component: UploadItem });

function UploadItem() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [uploadingMainFile, setUploadingMainFile] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [mainFileName, setMainFileName] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");
  const [docsFileName, setDocsFileName] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "",
    subcategory: "",
    price: "",
    description: "",
    tags: "",
    version: "1.0.0",
    license: "regular",
  });

  const cat = CATEGORY_TREE.find((c) => c.slug === form.category);

  const submitAction = useSelfHealingAction(
    async (
      payload: {
        title: string;
        category: string;
        subcategory: string;
        price: number;
        description: string;
        tags: string[];
        version: string;
      },
      signal,
    ) => {
      if (signal.aborted) throw new Error("Submit action aborted");
      return submitMarketplaceItem(payload);
    },
    {
      id: "marketplace-author-submit-item",
      retry: { maxAttempts: 2, backoffMs: 800 },
      onSuccess: () => {
        toast.success("Item submitted for review!");
        navigate({ to: "/marketplace/author/portfolio" });
      },
      onError: (error) => toast.error(getUiErrorMessage(error, "Submission failed.")),
    },
  );

  const submit = async () => {
    if (!form.title || !form.category || !form.price) {
      toast.error("Please complete required fields");
      return;
    }
    await submitAction.trigger({
      title: form.title,
      category: form.category,
      subcategory: form.subcategory,
      price: Number(form.price),
      description: form.description,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      version: form.version,
    });
  };

  const handleMainFileUpload = async () => {
    setUploadingMainFile(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setMainFileName("my-item.zip");
      toast.success("Main file uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload main file");
    } finally {
      setUploadingMainFile(false);
    }
  };

  const handlePreviewUpload = async () => {
    setUploadingPreview(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPreviewFileName("preview.png");
      toast.success("Preview image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload preview");
    } finally {
      setUploadingPreview(false);
    }
  };

  const handleDocsUpload = async () => {
    setUploadingDocs(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setDocsFileName("documentation.pdf");
      toast.success("Documentation uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload documentation");
    } finally {
      setUploadingDocs(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Upload New Item</h1>
      <div className="flex items-center gap-2 text-xs">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`px-3 py-1 rounded-full ${step === s ? "bg-primary text-white" : step > s ? "bg-success/20 text-success" : "bg-muted"}`}
          >
            Step {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="My awesome item"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v, subcategory: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_TREE.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategory</Label>
                <Select
                  value={form.subcategory}
                  onValueChange={(v) => setForm({ ...form, subcategory: v })}
                  disabled={!cat}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {cat?.subs.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your item, key features, what's included..."
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label>Price (USD) *</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="29"
                />
              </div>
              <div>
                <Label>Version</Label>
                <Input
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                />
              </div>
              <div>
                <Label>License Type</Label>
                <Select
                  value={form.license}
                  onValueChange={(v) => setForm({ ...form, license: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular License</SelectItem>
                    <SelectItem value="extended">Extended License</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="react, dashboard, tailwind"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} className="bg-primary hover:bg-primary/90">
                Next: Files
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <div className="font-medium">Main item file (.zip)</div>
              <div className="text-xs text-muted-foreground mb-3">Up to 500 MB</div>
              {mainFileName ? (
                <div className="text-sm text-success font-medium">{mainFileName}</div>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleMainFileUpload}
                  disabled={uploadingMainFile}
                >
                  {uploadingMainFile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Choose file"
                  )}
                </Button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <div className="text-sm font-medium">Preview image</div>
                <div className="text-xs text-muted-foreground mb-2">590 × 300 px</div>
                {previewFileName ? (
                  <div className="text-sm text-success font-medium">{previewFileName}</div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePreviewUpload}
                    disabled={uploadingPreview}
                  >
                    {uploadingPreview ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                )}
              </div>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <div className="text-sm font-medium">Documentation</div>
                <div className="text-xs text-muted-foreground mb-2">PDF or HTML</div>
                {docsFileName ? (
                  <div className="text-sm text-success font-medium">{docsFileName}</div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDocsUpload}
                    disabled={uploadingDocs}
                  >
                    {uploadingDocs ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="bg-primary hover:bg-primary/90">
                Next: Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted/50 rounded">
              <div className="text-muted-foreground">Title</div>
              <div className="font-medium">{form.title || "—"}</div>
              <div className="text-muted-foreground">Category</div>
              <div className="font-medium">
                {form.category || "—"} / {form.subcategory || "—"}
              </div>
              <div className="text-muted-foreground">Price</div>
              <div className="font-medium">${form.price || "0"}</div>
              <div className="text-muted-foreground">Version</div>
              <div className="font-medium">{form.version}</div>
              <div className="text-muted-foreground">License</div>
              <div className="font-medium capitalize">{form.license}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              By submitting, you agree to the ERP Vala Marketplace author terms. Your item will
              enter the review queue (typically 5–10 business days).
            </p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={() => void submit()}
                disabled={submitAction.isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                Submit for Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
