import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { ActionButton } from "@/components/ActionButton";
import { useAction } from "@/hooks/use-action";
import { useFormAutosave } from "@/hooks/use-form-autosave";
import { useSelfHeal } from "@/hooks/use-self-heal";
import { toast } from "sonner";

({
  component: CreateProductPage,
  head: () => ({ meta: [{ title: "Create Product — Merchant — ERP Vala" }] }),
});

function CreateProductPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [taxCategory, setTaxCategory] = useState("");
  const [enableVersioning, setEnableVersioning] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Form autosave draft ──────────────────────────────────────────────────
  const formData = useMemo(
    () =>
      ({ name, type, category, subcategory, description, taxCategory }) as Record<string, unknown>,
    [name, type, category, subcategory, description, taxCategory],
  );
  const { hasDraft, lastSaved, loadDraft, clearDraft } = useFormAutosave(formData, {
    draftKey: "merchant-create-product",
  });

  // Restore draft on first render (inline handler to avoid stale state)
  const handleRestoreDraft = () => {
    const draft = loadDraft() as typeof formData | null;
    if (!draft) return;
    if (draft.name) setName(draft.name as string);
    if (draft.type) setType(draft.type as string);
    if (draft.category) setCategory(draft.category as string);
    if (draft.subcategory) setSubcategory(draft.subcategory as string);
    if (draft.description) setDescription(draft.description as string);
    if (draft.taxCategory) setTaxCategory(draft.taxCategory as string);
    toast.info("Draft restored");
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Product name is required";
    if (name.length > 100) e.name = "Max 100 characters";
    if (!type) e.type = "Select a product type";
    if (!category) e.category = "Select a category";
    if (!description.trim()) e.description = "Description is required";
    if (description.length > 1000) e.description = "Max 1000 characters";
    if (!taxCategory) e.taxCategory = "Select a tax category";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Action: create product ───────────────────────────────────────────────
  const createAction = useAction(
    async (_payload: typeof formData, signal) => {
      // Simulate network call; replace with real API call
      await new Promise<void>((resolve, reject) =>
        setTimeout(() => {
          if (signal.aborted) {
            reject(new Error("Aborted"));
            return;
          }
          resolve();
        }, 1_000),
      );
      return { id: `prod_${Date.now()}` };
    },
    {
      id: "merchant-create-product",
      debounceMs: 500,
      timeoutMs: 15_000,
      retry: { maxAttempts: 2, backoffMs: 1_500 },
      onSuccess: (_result) => {
        clearDraft();
        toast.success("Product created successfully");
        void navigate({ to: "/merchant/products" });
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Failed to create product";
        toast.error(msg);
      },
    },
  );

  // ── Self-heal: reset if stuck in loading ─────────────────────────────────
  useSelfHeal({
    phase: createAction.phase,
    stuckThresholdMs: 20_000,
    onStuck: () => {
      createAction.reset();
      toast.error("Request is taking too long — please try again.");
    },
  });

  const handleSubmit = () => {
    if (!validate()) return;
    void createAction.trigger(formData);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/merchant/products">
          <ActionButton variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </ActionButton>
        </Link>
        <h1 className="text-2xl font-bold">Create Product</h1>
        {hasDraft && (
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Save className="h-3 w-3" />
            {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : "Draft saved"}
            <button
              type="button"
              className="underline hover:text-foreground"
              onClick={handleRestoreDraft}
            >
              Restore
            </button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Product Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CRM Pro"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Product Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saas">SaaS</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saas-tools">SaaS Tools</SelectItem>
                  <SelectItem value="desktop-apps">Desktop Apps</SelectItem>
                  <SelectItem value="mobile-apps">Mobile Apps</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crm">CRM</SelectItem>
                  <SelectItem value="erp">ERP</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tax Category *</Label>
              <Select value={taxCategory} onValueChange={setTaxCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tax category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Standard - Digital</SelectItem>
                  <SelectItem value="software">Standard - Software</SelectItem>
                  <SelectItem value="saas">Standard - SaaS</SelectItem>
                </SelectContent>
              </Select>
              {errors.taxCategory && (
                <p className="text-xs text-destructive">{errors.taxCategory}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product description..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{description.length}/1000</p>
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Versioning</Label>
              <p className="text-xs text-muted-foreground">Track product version history</p>
            </div>
            <Switch checked={enableVersioning} onCheckedChange={setEnableVersioning} />
          </div>
          <div className="space-y-2">
            <Label>Initial Version</Label>
            <Input defaultValue="1.0.0" placeholder="1.0.0" />
          </div>
          <div className="space-y-2">
            <Label>Custom Metadata (JSON)</Label>
            <Textarea
              placeholder='{ "industry": "retail", "features": ["analytics", "reporting"] }'
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link to="/merchant/products">
          <ActionButton variant="outline">Cancel</ActionButton>
        </Link>
        <ActionButton
          phase={createAction.phase}
          retryCountdown={createAction.retryCountdown}
          loadingLabel="Creating…"
          successLabel="Product Created!"
          onClick={handleSubmit}
        >
          Create Product
        </ActionButton>
      </div>
    </div>
  );
}

export default CreateProductPage;
