# Market Context & Strategic Addendum — LATAM-First Launch

*Supplement to mechanic-shop-prd-mvp-spec-v1.1.docx. Captures decisions and context established during the schema design session.*

---

## 1. Target Markets (v1)

| Market | Country Code | Lead Currency | Launch Priority |
|---|---|---|---|
| **Colombia** | CO | COP | **Lead market** — first pilot shops |
| Mexico | MX | MXN | v1 alongside CO |
| Chile | CL | CLP | v1 alongside CO |
| United States | US | USD | v1 (original spec market) |

**Rationale for LATAM-first:** Colombia was selected as the lead market due to a high density of independent mechanic shops operating without digital tooling. The spec's core value proposition (faster customer approvals, digital paper trail) maps directly to the bottlenecks CO shops face. MX and CL share the same fiscal complexity (mandatory e-invoicing), making them natural co-launches.

---

## 2. Per-Country Regulatory Requirements

This section is critical for the product and engineering roadmap. Each market has non-negotiable fiscal/legal requirements that affect the invoice workflow.

### Colombia — DIAN (Dirección de Impuestos y Aduanas Nacionales)

- **IVA rate:** 19% (standard)
- **Tax ID (shop):** NIT (Número de Identificación Tributaria) — format: `XXXXXXXXX-D` (9 digits + check digit)
- **Tax ID (customer):** NIT for businesses; Cédula de Ciudadanía (CC) for individuals
- **E-invoicing:** Mandatory via DIAN-authorized providers. Invoices must include:
  - CUFE (Código Único de Factura Electrónica)
  - QR code linking to DIAN verification
  - XML in DIAN UBL 2.1 format
  - Numbering range tied to a DIAN *resolución de facturación*
- **Common PSE providers (software interoperables):** Alegra, Siigo, Loggro
- **Payment processors:** Wompi (Bancolombia), PayU LATAM, Mercado Pago. **Stripe Connect is not available for Colombian merchants.**
- **MVP pilot plan:** Generate PDF invoices for early pilot shops. DIAN integration via PSE ships in Week 2–3 once shops obtain their *resolución*.

### Mexico — SAT (Servicio de Administración Tributaria)

- **IVA rate:** 16% standard; 8% in northern border zones (ZEE)
- **Tax ID (shop & customer):** RFC (Registro Federal de Contribuyentes) — format: 4 letters + 6 date digits + 3 homoclave
- **E-invoicing:** Mandatory CFDI 4.0 (Comprobante Fiscal Digital por Internet) via authorized PAC (Proveedor Autorizado de Certificación). Key fields:
  - UUID (folio fiscal)
  - `UsoCFDI` code per SAT catalog
  - `RegimenFiscal` of both issuer and receiver
  - Digital stamp (sello) from PAC
- **Common PACs:** Finkok, Edicom, Facturama
- **Payment processors:** Stripe works in MX (direct, not Connect). Mercado Pago, PayU also available.
- **MVP pilot plan:** PDF invoices for early shops; CFDI via PAC ships once RFC and FIEL certificate are in place.

### Chile — SII (Servicio de Impuestos Internos)

- **IVA rate:** 19%
- **Tax ID (shop & customer):** RUT (Rol Único Tributario) — format: `XXXXXXXX-D` (8 digits + check digit)
- **E-invoicing:** Mandatory DTE (Documento Tributario Electrónico) via SII. Types include Factura Electrónica (type 33) and Boleta (type 39). Key fields:
  - *Folio* from SII-issued range
  - XML digitally signed with shop's certificate
  - Timestamp from SII or authorized provider
- **Common providers:** Haulmer, Nubox, OpenFactura, Acepta
- **Payment processors:** Stripe not available for CL merchants. Transbank (dominant), Mercado Pago, Kushki.
- **MVP pilot plan:** PDF invoices; DTE integration ships with first paying CL shops.

### United States — No federal e-invoicing

- **Sales tax:** Variable by state. Ranges from 0% (MT, OR, NH) to ~10.5% (combined state+city). Shops set their own effective rate.
- **Tax ID (shop):** EIN (Employer Identification Number)
- **Tax ID (customer):** Not required on invoices in most cases.
- **Payment processors:** Stripe Connect supported. Standard Stripe also available.
- **MVP:** PDF invoices. Tax amount calculated from shop-set rate. No regulatory integration needed.

---

## 3. Currency Handling

- **One currency per shop**, set at onboarding and snapshotted on every RO and invoice.
- **Default currencies by country:** COP (CO), MXN (MX), CLP (CL), USD (US).
- **Storage:** All monetary amounts stored as `BIGINT` in the currency's minor unit (e.g., COP centavos — though in practice COP prices are always whole pesos). This avoids floating-point drift and matches payment processor wire formats.
- **Display:** Client uses `Intl.NumberFormat(locale, { style: 'currency', currency })` — automatically handles COP/CLP conventions (no decimal display), MXN (2 decimals), USD (2 decimals).
- **Cross-country reporting:** Deferred. Single-currency per shop is the MVP assumption.

---

## 4. Payment Processor Strategy

Stripe Connect is not available in Colombia or Chile. The schema is **payment-provider agnostic** from day one:

| Provider | Available in | Notes |
|---|---|---|
| Stripe | US, MX | Full Connect for marketplace; direct for MX |
| Wompi | CO | Bancolombia-backed; strong CO adoption |
| PayU | CO, MX, CL | Pan-LATAM |
| Mercado Pago | CO, MX, CL | Strong consumer brand |
| Transbank | CL | Dominant Chilean card network |
| Manual | All | Cash, check, bank transfer — always available |

**MVP:** Shops record payments manually (mark-as-paid). Payment provider integration ships in Week 3.

---

## 5. Vehicle Data Model (key design decision)

Vehicles are **independent entities**, not permanently attached to a single customer. This matters in LATAM where:
- Used-car culture is strong; vehicles change hands frequently
- Fleet operators (empresas de transporte) own multiple vehicles billed to one NIT
- A single vehicle might be serviced by family members across different customer records

**Design:**
- `vehicles` table has a UUID PK and VIN (when known)
- `vehicle_ownerships` tracks historical and current customer→vehicle relationships
- `vehicles.current_customer_id` is a denormalized FK for fast UI lookups, kept in sync via DB trigger

---

## 6. Multi-Tenancy & Future Multi-Location

The data model uses a `shop_memberships` join table (user → shop, with role). This is an intentional forward-compatibility choice:

- **MVP:** One shop per owner, two roles (owner, tech)
- **Month 5+:** Add multi-location by adding memberships — no migration needed
- **Roles** are a narrow enum (`owner`, `tech`) today; `service_advisor`, `manager` can be added via `ALTER TYPE`

---

## 7. Onboarding KPI Update

The original spec targets **"first RO in < 15 minutes from signup."** In LATAM markets, this may need to account for:

- First-time shop setup including country selection, NIT/RFC/RUT entry, and tax rate confirmation
- DIAN/SAT/SII registration (async — shops may need to complete this offline before fiscal invoicing works)
- Language: Spanish-language onboarding UI required for CO/MX/CL pilot shops

**Suggested KPI revision:** *First RO created in < 15 minutes from signup* (unchanged) + *First fiscal invoice issued in < 24 hours from DIAN/SAT/SII registration completion.*

---

## 8. Localization Requirements (not in v1.1 spec)

For CO/MX/CL launch, the following must be localized in Spanish:

- Customer-facing approval page (`/approve/[token]`) — shown to end customers on their phone
- Invoice PDF (shop name, line items, totals, tax breakdown, e-invoicing QR)
- Onboarding flow (country selection, tax ID entry, shop profile)

Recommended approach: `next-intl` with `es` and `en` locale files. Colombian Spanish (`es-CO`) is the lead locale.

---

## 9. Data & Privacy Considerations

- **Colombia:** Ley 1581 de 2012 (Habeas Data) — shops must have authorization to store customer personal data (name, phone, email). Consider a minimal consent acknowledgment during customer creation in the UI.
- **Mexico:** LFPDPPP (Ley Federal de Protección de Datos Personales) — similar consent requirements.
- **Chile:** Ley 19.628 — being replaced by new data protection law. Monitor developments.
- **US:** State-level (CCPA in CA). Less urgent for MVP given US market is not the lead.

**Minimum viable approach for MVP:** Add a `data_consent_given_at` field to `customers` table when the laws require documented consent.

---

## 10. Deferred Integrations (roadmap)

| Integration | Market | When |
|---|---|---|
| DIAN e-invoicing via Alegra/Siigo/Loggro | CO | Week 2–3 |
| CFDI e-invoicing via Finkok/Edicom | MX | Week 2–3 |
| DTE e-invoicing via Haulmer/Nubox | CL | Week 2–3 |
| Wompi payment integration | CO | Week 3 |
| PayU payment integration | CO, MX, CL | Week 3 |
| Mercado Pago payment integration | CO, MX, CL | Week 3 |
| Stripe Connect | US | Week 3 |
| SMS via Twilio/MessageBird (Colombia: also Telnyx) | All | Week 2 |
| Multi-location shop support | All | Month 5 |
| Cross-country analytics dashboard | All | Month 6+ |
