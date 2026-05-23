CREATE TABLE "purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"po_number" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"approval_note" text,
	"rejection_reason" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_workspace_po_unique" UNIQUE("workspace_id","po_number")
);
--> statement-breakpoint
CREATE TABLE "shipment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"purchase_order_item_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"status" text NOT NULL,
	"location" text,
	"note" text,
	"performed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"shipment_number" text NOT NULL,
	"shipment_date" date,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_company_id_workspaces_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_purchase_order_item_id_purchase_order_items_id_fk" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_tracking" ADD CONSTRAINT "shipment_tracking_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_tracking" ADD CONSTRAINT "shipment_tracking_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_tracking" ADD CONSTRAINT "shipment_tracking_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS purchase_orders_workspace_idx ON public.purchase_orders (workspace_id);
CREATE INDEX IF NOT EXISTS purchase_orders_company_idx ON public.purchase_orders (company_id);
CREATE INDEX IF NOT EXISTS purchase_orders_supplier_idx ON public.purchase_orders (supplier_id);
CREATE INDEX IF NOT EXISTS purchase_orders_status_idx ON public.purchase_orders (status);
CREATE INDEX IF NOT EXISTS purchase_order_items_po_idx ON public.purchase_order_items (purchase_order_id);
CREATE INDEX IF NOT EXISTS shipments_po_idx ON public.shipments (purchase_order_id);
CREATE INDEX IF NOT EXISTS shipments_workspace_idx ON public.shipments (workspace_id);
CREATE INDEX IF NOT EXISTS shipment_items_shipment_idx ON public.shipment_items (shipment_id);
CREATE INDEX IF NOT EXISTS shipment_tracking_shipment_idx ON public.shipment_tracking (shipment_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking ENABLE ROW LEVEL SECURITY;

-- purchase_orders: select (workspace members including parent)
CREATE POLICY "purchase_orders_select"
ON public.purchase_orders FOR SELECT
USING (
  public.is_super_admin()
  OR public.is_workspace_member(workspace_id)
);

-- purchase_orders: insert (procurement, manager, admin)
CREATE POLICY "purchase_orders_insert"
ON public.purchase_orders FOR INSERT
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = purchase_orders.workspace_id
      AND m.role IN ('admin', 'manager', 'procurement')
  )
);

-- purchase_orders: update (procurement, manager, admin — status transitions enforced in app layer)
CREATE POLICY "purchase_orders_update"
ON public.purchase_orders FOR UPDATE
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = purchase_orders.workspace_id
      AND m.role IN ('admin', 'manager', 'procurement')
  )
)
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = purchase_orders.workspace_id
      AND m.role IN ('admin', 'manager', 'procurement')
  )
);

-- purchase_orders: delete (draft only, admin/manager — enforced in app layer)
CREATE POLICY "purchase_orders_delete"
ON public.purchase_orders FOR DELETE
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = purchase_orders.workspace_id
      AND m.role IN ('admin', 'manager', 'procurement')
  )
);

-- purchase_order_items: select
CREATE POLICY "purchase_order_items_select"
ON public.purchase_order_items FOR SELECT
USING (
  public.is_super_admin()
  OR public.is_workspace_member(workspace_id)
);

-- purchase_order_items: insert/update/delete
CREATE POLICY "purchase_order_items_insert"
ON public.purchase_order_items FOR INSERT
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = purchase_order_items.workspace_id
      AND m.role IN ('admin', 'manager', 'procurement')
  )
);

CREATE POLICY "purchase_order_items_update"
ON public.purchase_order_items FOR UPDATE
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = purchase_order_items.workspace_id
      AND m.role IN ('admin', 'manager', 'procurement')
  )
)
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = purchase_order_items.workspace_id
      AND m.role IN ('admin', 'manager', 'procurement')
  )
);

CREATE POLICY "purchase_order_items_delete"
ON public.purchase_order_items FOR DELETE
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = purchase_order_items.workspace_id
      AND m.role IN ('admin', 'manager', 'procurement')
  )
);

-- shipments: select
CREATE POLICY "shipments_select"
ON public.shipments FOR SELECT
USING (
  public.is_super_admin()
  OR public.is_workspace_member(workspace_id)
);

-- shipments: insert/update/delete (supplier, admin)
CREATE POLICY "shipments_insert"
ON public.shipments FOR INSERT
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = shipments.workspace_id
      AND m.role IN ('admin', 'manager', 'supplier')
  )
);

CREATE POLICY "shipments_update"
ON public.shipments FOR UPDATE
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = shipments.workspace_id
      AND m.role IN ('admin', 'manager', 'supplier', 'logistics')
  )
)
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = shipments.workspace_id
      AND m.role IN ('admin', 'manager', 'supplier', 'logistics')
  )
);

CREATE POLICY "shipments_delete"
ON public.shipments FOR DELETE
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = shipments.workspace_id
      AND m.role IN ('admin', 'manager', 'supplier')
  )
);

-- shipment_items: select
CREATE POLICY "shipment_items_select"
ON public.shipment_items FOR SELECT
USING (
  public.is_super_admin()
  OR public.is_workspace_member(workspace_id)
);

CREATE POLICY "shipment_items_insert"
ON public.shipment_items FOR INSERT
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = shipment_items.workspace_id
      AND m.role IN ('admin', 'manager', 'supplier')
  )
);

CREATE POLICY "shipment_items_update"
ON public.shipment_items FOR UPDATE
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = shipment_items.workspace_id
      AND m.role IN ('admin', 'manager', 'supplier')
  )
)
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = shipment_items.workspace_id
      AND m.role IN ('admin', 'manager', 'supplier')
  )
);

CREATE POLICY "shipment_items_delete"
ON public.shipment_items FOR DELETE
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = shipment_items.workspace_id
      AND m.role IN ('admin', 'manager', 'supplier')
  )
);

-- shipment_tracking: select
CREATE POLICY "shipment_tracking_select"
ON public.shipment_tracking FOR SELECT
USING (
  public.is_super_admin()
  OR public.is_workspace_member(workspace_id)
);

CREATE POLICY "shipment_tracking_insert"
ON public.shipment_tracking FOR INSERT
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.workspace_id = shipment_tracking.workspace_id
      AND m.role IN ('admin', 'manager', 'supplier', 'logistics')
  )
);

CREATE POLICY "shipment_tracking_update"
ON public.shipment_tracking FOR UPDATE
USING (false);

CREATE POLICY "shipment_tracking_delete"
ON public.shipment_tracking FOR DELETE
USING (false);